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

        // FIFO sell metrics across all FYs so lot pools carry over correctly
        var allSellMetrics = ComputeAllSellMetrics(audTrades);

        foreach (var trade in fyTrades)
        {
            if (trade.TradeType == TradeType.Sell && allSellMetrics.TryGetValue(trade.Id, out var m))
            {
                totalProceeds  += m.Proceeds;
                totalCostBasis += m.CostBasis;
                netTaxableGain += m.TaxableGain;
                if (m.CgtDiscountApplies) anyDiscount = true;

                rows.Add(new ReportRow(
                    Date:                      trade.DateOfTrade,
                    TradeType:                 "Sell",
                    Description:               GetDescription(trade),
                    Units:                     trade.NumberOfUnits,
                    PricePerUnit:              trade.PricePerUnit,
                    TotalValue:                trade.TotalValue,
                    CostBasis:                 m.CostBasis,
                    GrossGainLoss:             m.GainLoss,
                    TaxableGain:               m.TaxableGain,
                    CgtDiscountApplied:        m.CgtDiscountApplies,
                    IsSplit:                   m.IsSplit,
                    SplitDiscountedTaxable:    m.IsSplit ? m.SplitDiscountedTaxable : null,
                    SplitNonDiscountedTaxable: m.IsSplit ? m.SplitNonDiscountedTaxable : null));
            }
            else
            {
                rows.Add(new ReportRow(
                    Date:                      trade.DateOfTrade,
                    TradeType:                 "Buy",
                    Description:               GetDescription(trade),
                    Units:                     trade.NumberOfUnits,
                    PricePerUnit:              trade.PricePerUnit,
                    TotalValue:                trade.TotalValue,
                    CostBasis:                 null,
                    GrossGainLoss:             null,
                    TaxableGain:               null,
                    CgtDiscountApplied:        false,
                    IsSplit:                   false,
                    SplitDiscountedTaxable:    null,
                    SplitNonDiscountedTaxable: null));
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

    // ── CGT calculation — FIFO lot-based (mirrors frontend ReportsView.tsx logic) ──

    private sealed class BuyLot
    {
        public required DateOnly Date        { get; init; }
        public required decimal  CostPerUnit { get; init; }
        public          decimal  Remaining   { get; set; }
    }

    private sealed record SellResult(
        decimal CostBasis,
        decimal Proceeds,
        decimal GainLoss,
        bool    CgtDiscountApplies,
        decimal TaxableGain,
        bool    IsSplit,
        decimal SplitDiscountedTaxable,
        decimal SplitNonDiscountedTaxable);

    // Processes all AUD trades using FIFO lot tracking so that when a sale spans
    // buy lots with different holding periods, the 50% CGT discount is applied
    // only to the portion held for more than 12 months.
    private static Dictionary<Guid, SellResult> ComputeAllSellMetrics(IReadOnlyList<Trade> audTrades)
    {
        var byAsset = audTrades
            .GroupBy(AssetKey)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(t => t.DateOfTrade).ThenBy(t => t.CreatedAt).ToList());

        var result = new Dictionary<Guid, SellResult>();

        foreach (var trades in byAsset.Values)
        {
            var lots = new List<BuyLot>();

            foreach (var trade in trades)
            {
                if (trade.TradeType == TradeType.Buy)
                {
                    var brokerage = GetBrokerageFees(trade);
                    var totalCost = trade.PricePerUnit * trade.NumberOfUnits + brokerage;
                    lots.Add(new BuyLot
                    {
                        Date        = trade.DateOfTrade,
                        CostPerUnit = trade.NumberOfUnits > 0 ? totalCost / trade.NumberOfUnits : 0m,
                        Remaining   = trade.NumberOfUnits,
                    });
                }
                else if (trade.TradeType == TradeType.Sell)
                {
                    var sellBrokerage   = GetBrokerageFees(trade);
                    var totalProceeds   = trade.PricePerUnit * trade.NumberOfUnits - sellBrokerage;
                    var proceedsPerUnit = trade.NumberOfUnits > 0 ? totalProceeds / trade.NumberOfUnits : 0m;
                    var sellDate        = trade.DateOfTrade;

                    decimal unitsToSell          = trade.NumberOfUnits;
                    decimal totalCostBasis        = 0;
                    decimal discountedTaxable     = 0;
                    decimal nonDiscountedTaxable  = 0;
                    bool    anyDiscount           = false;
                    bool    anyNonDiscount        = false;

                    foreach (var lot in lots)
                    {
                        if (unitsToSell <= 0) break;
                        if (lot.Remaining == 0) continue;

                        var unitsFromLot = Math.Min(lot.Remaining, unitsToSell);
                        lot.Remaining -= unitsFromLot;
                        unitsToSell   -= unitsFromLot;

                        var lotCostBasis = lot.CostPerUnit * unitsFromLot;
                        var lotProceeds  = proceedsPerUnit * unitsFromLot;
                        var lotGain      = lotProceeds - lotCostBasis;
                        totalCostBasis  += lotCostBasis;

                        var oneYearAfterBuy = lot.Date.AddYears(1);
                        var discountApplies = lotGain > 0 && sellDate > oneYearAfterBuy;

                        if (discountApplies)
                        {
                            anyDiscount        = true;
                            discountedTaxable += lotGain * 0.5m;
                        }
                        else
                        {
                            anyNonDiscount       = true;
                            nonDiscountedTaxable += lotGain;
                        }
                    }

                    result[trade.Id] = new SellResult(
                        CostBasis:                totalCostBasis,
                        Proceeds:                 totalProceeds,
                        GainLoss:                 totalProceeds - totalCostBasis,
                        CgtDiscountApplies:       anyDiscount,
                        TaxableGain:              discountedTaxable + nonDiscountedTaxable,
                        IsSplit:                  anyDiscount && anyNonDiscount,
                        SplitDiscountedTaxable:   discountedTaxable,
                        SplitNonDiscountedTaxable: nonDiscountedTaxable);
                }
            }
        }

        return result;
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
