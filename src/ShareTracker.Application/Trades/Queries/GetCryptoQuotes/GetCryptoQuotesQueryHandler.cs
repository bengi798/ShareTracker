using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Queries.GetCryptoQuotes;

public class GetCryptoQuotesQueryHandler
    : IRequestHandler<GetCryptoQuotesQuery, IReadOnlyList<CryptoQuoteDto>>
{
    private readonly ITradeRepository    _trades;
    private readonly ICurrentUserService _currentUser;
    private readonly IMarketDataService  _marketData;

    public GetCryptoQuotesQueryHandler(
        ITradeRepository    trades,
        ICurrentUserService currentUser,
        IMarketDataService  marketData)
    {
        _trades      = trades;
        _currentUser = currentUser;
        _marketData  = marketData;
    }

    public async Task<IReadOnlyList<CryptoQuoteDto>> Handle(
        GetCryptoQuotesQuery request, CancellationToken cancellationToken)
    {
        // 1. Get all user trades, filter to open crypto positions
        var all = await _trades.GetAllByUserIdAsync(_currentUser.UserId, cancellationToken);

        // Net units per (CoinSymbol, Exchange) pair
        var positions = all
            .OfType<CryptoTrade>()
            .GroupBy(t => (CoinSymbol: t.CoinSymbol.ToUpperInvariant(), t.Currency))
            .Select(g => new
            {
                g.Key.CoinSymbol,
                NetUnits = g.Sum(t => t.TradeType == TradeType.Buy ? t.NumberOfUnits : -t.NumberOfUnits),
            })
            .Where(p => p.NetUnits > 0)
            .OrderBy(p => p.CoinSymbol)
            .ToList();

        if (positions.Count == 0)
            return Array.Empty<CryptoQuoteDto>();

        // 2. Map Exchange enum → EODHD exchange code
        var symbols = positions
            .Select(p => (p.CoinSymbol+"-USD", ExchangeCode: ToEodhdExchangeCode()))
            .ToList();

        // 3. Fetch closing prices (cached per day)
        var prices = await _marketData.GetLatestClosingPricesAsync(symbols, cancellationToken);

        // 4. Build DTOs
        return positions
            .Select(p =>
            {
                var exchangeCode = ToEodhdExchangeCode();
                var key          = $"{p.CoinSymbol.ToUpperInvariant()}-USD.{exchangeCode}";
                var hasPrice     = prices.TryGetValue(key, out var close) && close.HasValue;

                return new CryptoQuoteDto(
                    CoinSymbol:    p.CoinSymbol.ToUpperInvariant(),
                    LastClose: hasPrice ? close : null,
                    AsOf:      hasPrice ? DateOnly.FromDateTime(DateTime.UtcNow.Date) : null);
            })
            .ToList();
    }

    private static string ToEodhdExchangeCode()
    {
        return "CC"; // EODHD uses "CC" for crypto exchanges.
    }
}
