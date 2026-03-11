using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Queries.GetGoldQuotes;

public class GetGoldQuotesQueryHandler
    : IRequestHandler<GetGoldQuotesQuery, IReadOnlyList<GoldQuoteDto>>
{
    // Weight conversion factors relative to troy ounce
    private const decimal GramsPerTroyOz = 31.1035m;
    private const decimal GramsPerTola   = 11.6638m;

    private readonly ITradeRepository    _trades;
    private readonly ICurrentUserService _currentUser;
    private readonly IMarketDataService  _marketData;

    public GetGoldQuotesQueryHandler(
        ITradeRepository    trades,
        ICurrentUserService currentUser,
        IMarketDataService  marketData)
    {
        _trades      = trades;
        _currentUser = currentUser;
        _marketData  = marketData;
    }

    public async Task<IReadOnlyList<GoldQuoteDto>> Handle(
        GetGoldQuotesQuery request, CancellationToken cancellationToken)
    {
        // 1. Compute net units per (PurityCarats, WeightUnit) position
        var all = await _trades.GetAllByUserIdAsync(_currentUser.UserId, cancellationToken);

        var positions = all
            .OfType<GoldTrade>()
            .GroupBy(t => (t.PurityCarats, t.WeightUnit))
            .Select(g => new
            {
                g.Key.PurityCarats,
                g.Key.WeightUnit,
                NetUnits = g.Sum(t => t.TradeType == TradeType.Buy ? t.NumberOfUnits : -t.NumberOfUnits),
            })
            .Where(p => p.NetUnits > 0)
            .OrderBy(p => p.PurityCarats)
            .ThenBy(p => p.WeightUnit)
            .ToList();

        if (positions.Count == 0)
            return Array.Empty<GoldQuoteDto>();

        // 2. Fetch spot gold price (AUD per troy oz) via EODHD EOD FOREX endpoint
        //    EODHD gold symbol is XAUAUD on the FOREX exchange
        var prices = await _marketData.GetLatestClosingPricesAsync(
            [("XAUAUD", "FOREX")], cancellationToken);
        prices.TryGetValue("XAUAUD.FOREX", out var spotUsdPerTroyOz);

        // 3. Build DTOs — adjust for purity and weight unit
        var asOf = spotUsdPerTroyOz.HasValue ? DateOnly.FromDateTime(DateTime.UtcNow.Date) : (DateOnly?)null;

        return positions.Select(p =>
        {
            decimal? pricePerUnit = null;
            if (spotUsdPerTroyOz.HasValue)
            {
                var purityFactor = p.PurityCarats / 24m;
                pricePerUnit = p.WeightUnit switch
                {
                    WeightUnit.TroyOunces => spotUsdPerTroyOz.Value * purityFactor,
                    WeightUnit.Grams      => spotUsdPerTroyOz.Value * purityFactor / GramsPerTroyOz,
                    WeightUnit.Tolas      => spotUsdPerTroyOz.Value * purityFactor / GramsPerTroyOz * GramsPerTola,
                    _                     => null,
                };
            }

            return new GoldQuoteDto(
                PurityCarats:     p.PurityCarats,
                WeightUnit:       p.WeightUnit.ToString(),
                NetUnits:         p.NetUnits,
                SpotUsdPerTroyOz: spotUsdPerTroyOz,
                PricePerUnit:     pricePerUnit,
                AsOf:             asOf);
        }).ToList();
    }
}
