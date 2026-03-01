using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Reports;

public class GenerateReportQueryHandler
    : IRequestHandler<GenerateReportQuery, (byte[] Bytes, string ContentType, string FileName)>
{
    private readonly ITradeRepository _trades;
    private readonly ICurrentUserService _currentUser;
    private readonly IReportGeneratorService _generator;

    public GenerateReportQueryHandler(
        ITradeRepository trades,
        ICurrentUserService currentUser,
        IReportGeneratorService generator)
    {
        _trades = trades;
        _currentUser = currentUser;
        _generator = generator;
    }

    public async Task<(byte[] Bytes, string ContentType, string FileName)> Handle(
        GenerateReportQuery request, CancellationToken cancellationToken)
    {
        var allTrades = await _trades.GetAllByUserIdAsync(_currentUser.UserId, cancellationToken);

        // Only AUD-denominated trades are included
        var audTrades = allTrades.Where(t => t.Currency == Currency.AUD).ToList();
        var excludedCount = allTrades.Count - audTrades.Count;

        // FY boundaries: FY N = 1 July (N-1) to 30 June N
        var fyStart = new DateOnly(request.FinancialYear - 1, 7, 1);
        var fyEnd   = new DateOnly(request.FinancialYear, 6, 30);

        var fyTrades = audTrades
            .Where(t => t.DateOfTrade >= fyStart && t.DateOfTrade <= fyEnd)
            .OrderBy(t => t.DateOfTrade)
            .ThenBy(t => t.CreatedAt)
            .ToList();

        var rows = new List<ReportRow>();
        decimal totalProceeds  = 0;
        decimal totalCostBasis = 0;
        decimal netTaxableGain = 0;
        bool anyDiscount = false;

        foreach (var trade in fyTrades)
        {
            if (trade.TradeType == TradeType.Sell)
            {
                var (costBasis, proceeds, gainLoss, cgtDiscount, taxableGain) =
                    ComputeSellMetrics(trade, audTrades);

                totalProceeds  += proceeds;
                totalCostBasis += costBasis;
                netTaxableGain += taxableGain;
                if (cgtDiscount) anyDiscount = true;

                rows.Add(new ReportRow(
                    Date:              trade.DateOfTrade,
                    TradeType:         "Sell",
                    Description:       GetDescription(trade),
                    Units:             trade.NumberOfUnits,
                    PricePerUnit:      trade.PricePerUnit,
                    TotalValue:        trade.TotalValue,
                    CostBasis:         costBasis,
                    GrossGainLoss:     gainLoss,
                    TaxableGain:       taxableGain,
                    CgtDiscountApplied: cgtDiscount));
            }
            else
            {
                rows.Add(new ReportRow(
                    Date:              trade.DateOfTrade,
                    TradeType:         "Buy",
                    Description:       GetDescription(trade),
                    Units:             trade.NumberOfUnits,
                    PricePerUnit:      trade.PricePerUnit,
                    TotalValue:        trade.TotalValue,
                    CostBasis:         null,
                    GrossGainLoss:     null,
                    TaxableGain:       null,
                    CgtDiscountApplied: false));
            }
        }

        var netGainLoss = totalProceeds - totalCostBasis;

        var reportData = new ReportData(
            FinancialYear:     request.FinancialYear,
            TotalProceeds:     totalProceeds,
            TotalCostBasis:    totalCostBasis,
            NetGainLoss:       netGainLoss,
            NetTaxableGain:    netTaxableGain,
            AnyDiscountApplied: anyDiscount,
            ExcludedNonAudCount: excludedCount,
            Rows:              rows);

        var format = request.Format.ToLowerInvariant();
        if (format == "csv")
        {
            var bytes = _generator.GenerateCsv(reportData);
            return (bytes, "text/csv", $"capital-gains-report-fy{request.FinancialYear}.csv");
        }
        else
        {
            var bytes = _generator.GeneratePdf(reportData);
            return (bytes, "application/pdf", $"capital-gains-report-fy{request.FinancialYear}.pdf");
        }
    }

    // ── CGT calculation (mirrors frontend ReportsView.tsx logic) ─────────────

    private static (decimal CostBasis, decimal Proceeds, decimal GainLoss, bool CgtDiscount, decimal TaxableGain)
        ComputeSellMetrics(Trade sell, IReadOnlyList<Trade> audTrades)
    {
        var key = AssetKey(sell);

        // Collect all same-asset buy trades up to and including this sell, ordered by date/created
        var history = audTrades
            .Where(t => AssetKey(t) == key)
            .OrderBy(t => t.DateOfTrade)
            .ThenBy(t => t.CreatedAt)
            .ToList();

        decimal sumBuyUnits = 0;
        decimal sumBuyValue = 0;
        DateOnly? earliestBuyDate = null;

        foreach (var t in history)
        {
            if (t.TradeType == TradeType.Buy)
            {
                earliestBuyDate ??= t.DateOfTrade;
                sumBuyUnits += t.NumberOfUnits;
                sumBuyValue += t.PricePerUnit * t.NumberOfUnits + GetBrokerageFees(t);
            }
            if (t.Id == sell.Id) break;
        }

        var avgCost   = sumBuyUnits > 0 ? sumBuyValue / sumBuyUnits : 0m;
        var costBasis = avgCost * sell.NumberOfUnits;
        var proceeds  = sell.PricePerUnit * sell.NumberOfUnits - GetBrokerageFees(sell);
        var gainLoss  = proceeds - costBasis;

        // Australian 50% CGT discount: positive gain held > 12 months
        bool cgtDiscount = false;
        if (gainLoss > 0 && earliestBuyDate.HasValue)
        {
            var oneYearAfterBuy = earliestBuyDate.Value.AddYears(1);
            cgtDiscount = sell.DateOfTrade > oneYearAfterBuy;
        }

        var taxableGain = cgtDiscount ? gainLoss * 0.5m : gainLoss;
        return (costBasis, proceeds, gainLoss, cgtDiscount, taxableGain);
    }

    private static string AssetKey(Trade trade) => trade switch
    {
        SharesTrade   st => $"Shares|{st.Ticker.Value}|{st.Exchange}",
        CryptoTrade   ct => $"Crypto|{ct.CoinSymbol}",
        GoldTrade     gt => $"Gold|{gt.PurityCarats}|{gt.WeightUnit}",
        BondTrade     bt => $"Bond|{bt.BondCode}",
        PropertyTrade pt => $"Property|{pt.Address.ToLowerInvariant()}",
        _               => throw new InvalidOperationException($"Unknown trade type: {trade.GetType().Name}")
    };

    private static decimal GetBrokerageFees(Trade trade) => trade switch
    {
        SharesTrade st => st.BrokerageFees ?? 0m,
        CryptoTrade ct => ct.BrokerageFees ?? 0m,
        _              => 0m
    };

    private static string GetDescription(Trade trade) => trade switch
    {
        SharesTrade   st => $"{st.Ticker.Value} · {st.Exchange}",
        CryptoTrade   ct => ct.CoinSymbol,
        GoldTrade     gt => $"{gt.PurityCarats}K · {(gt.WeightUnit == WeightUnit.TroyOunces ? "Troy Oz" : gt.WeightUnit.ToString())}",
        BondTrade     bt => $"{bt.BondCode} · {bt.YieldPercent}% · {bt.Issuer}",
        PropertyTrade pt => $"{pt.Address} · {pt.PropertyType}",
        _               => throw new InvalidOperationException($"Unknown trade type: {trade.GetType().Name}")
    };
}
