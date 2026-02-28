using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Queries.GetSharesQuotes;

public class GetSharesQuotesQueryHandler
    : IRequestHandler<GetSharesQuotesQuery, IReadOnlyList<SharesQuoteDto>>
{
    private readonly ITradeRepository    _trades;
    private readonly ICurrentUserService _currentUser;
    private readonly IMarketDataService  _marketData;

    public GetSharesQuotesQueryHandler(
        ITradeRepository    trades,
        ICurrentUserService currentUser,
        IMarketDataService  marketData)
    {
        _trades      = trades;
        _currentUser = currentUser;
        _marketData  = marketData;
    }

    public async Task<IReadOnlyList<SharesQuoteDto>> Handle(
        GetSharesQuotesQuery request, CancellationToken cancellationToken)
    {
        // 1. Get all user trades, filter to open shares positions
        var all = await _trades.GetAllByUserIdAsync(_currentUser.UserId, cancellationToken);

        // Net units per (Ticker, Exchange) pair
        var positions = all
            .OfType<SharesTrade>()
            .GroupBy(t => (Ticker: t.Ticker.Value, Exchange: t.Exchange))
            .Select(g => new
            {
                g.Key.Ticker,
                g.Key.Exchange,
                NetUnits = g.Sum(t => t.TradeType == TradeType.Buy ? t.NumberOfUnits : -t.NumberOfUnits),
            })
            .Where(p => p.NetUnits > 0)
            .OrderBy(p => p.Ticker)
            .ToList();

        if (positions.Count == 0)
            return Array.Empty<SharesQuoteDto>();

        // 2. Map Exchange enum → EODHD exchange code
        var symbols = positions
            .Select(p => (p.Ticker, ExchangeCode: ToEodhdExchangeCode(p.Exchange)))
            .ToList();

        // 3. Fetch closing prices (cached per day)
        var prices = await _marketData.GetLatestClosingPricesAsync(symbols, cancellationToken);

        // 4. Build DTOs
        return positions
            .Select(p =>
            {
                var exchangeCode = ToEodhdExchangeCode(p.Exchange);
                var key          = $"{p.Ticker.ToUpperInvariant()}.{exchangeCode}";
                var hasPrice     = prices.TryGetValue(key, out var close) && close.HasValue;

                return new SharesQuoteDto(
                    Ticker:    p.Ticker.ToUpperInvariant(),
                    Exchange:  p.Exchange.ToString(),
                    LastClose: hasPrice ? close : null,
                    AsOf:      hasPrice ? DateOnly.FromDateTime(DateTime.UtcNow.Date) : null);
            })
            .ToList();
    }

    private static string ToEodhdExchangeCode(Exchange exchange) => exchange switch
    {
        Exchange.NYSE   => "US",
        Exchange.NASDAQ => "US",
        Exchange.ASX    => "AU",
        Exchange.LSE    => "LSE",
        Exchange.TSX    => "TO",
        _               => "US",
    };
}
