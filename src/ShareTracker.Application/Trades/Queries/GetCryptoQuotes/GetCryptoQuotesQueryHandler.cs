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
    private readonly ICoinGeckoService   _coinGecko;

    public GetCryptoQuotesQueryHandler(
        ITradeRepository    trades,
        ICurrentUserService currentUser,
        IMarketDataService  marketData,
        ICoinGeckoService   coinGecko)
    {
        _trades      = trades;
        _currentUser = currentUser;
        _marketData  = marketData;
        _coinGecko   = coinGecko;
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

        // 2. Map coin symbols → EODHD format and fetch USD closing prices
        var symbols = positions
            .Select(p => (p.CoinSymbol + "-USD", ExchangeCode: ToEodhdExchangeCode()))
            .ToList();

        // 3. Fetch USD prices (EODHD, cached per day) and AUD prices (CoinGecko, cached 5 min) in parallel
        var coinSymbolList = positions.Select(p => p.CoinSymbol).ToList();
        var pricesTask    = _marketData.GetLatestClosingPricesAsync(symbols, cancellationToken);
        var audPricesTask = _coinGecko.GetAudPricesAsync(coinSymbolList, cancellationToken);
        await Task.WhenAll(pricesTask, audPricesTask);
        var prices    = pricesTask.Result;
        var audPrices = audPricesTask.Result;

        // 4. Build DTOs
        var asOf = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        return positions
            .Select(p =>
            {
                var key      = $"{p.CoinSymbol.ToUpperInvariant()}-USD.{ToEodhdExchangeCode()}";
                var hasUsd   = prices.TryGetValue(key, out var close) && close.HasValue;
                audPrices.TryGetValue(p.CoinSymbol, out var audClose);

                return new CryptoQuoteDto(
                    CoinSymbol:    p.CoinSymbol.ToUpperInvariant(),
                    LastClose:     hasUsd   ? close    : null,
                    LastCloseAud:  audClose,
                    AsOf:          hasUsd || audClose.HasValue ? asOf : null);
            })
            .ToList();
    }

    private static string ToEodhdExchangeCode()
    {
        return "CC"; // EODHD uses "CC" for crypto exchanges.
    }
}
