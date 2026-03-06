namespace ShareTracker.Application.Common.Interfaces;

public record MarketDividend(
    DateOnly  ExDate,
    DateOnly? PaymentDate,
    string    Period,
    decimal   Value,
    string    Currency,
    decimal   FrankingPercent);

public interface IMarketDataService
{
    /// <summary>
    /// Returns the latest end-of-day closing price for each requested symbol.
    /// Key format: "TICKER.EXCHANGE_CODE" (e.g. "AAPL.US", "BHP.AU").
    /// Value is null if the price could not be retrieved (bad symbol, network error, etc.).
    /// </summary>
    Task<IReadOnlyDictionary<string, decimal?>> GetLatestClosingPricesAsync(
        IReadOnlyList<(string Ticker, string ExchangeCode)> symbols,
        CancellationToken ct = default);

    /// <summary>
    /// Returns dividend records for the given symbol (e.g. "BHP.AU") from <paramref name="from"/> onwards.
    /// Returns an empty list on failure.
    /// </summary>
    Task<IReadOnlyList<MarketDividend>> GetDividendsAsync(
        string symbol,
        DateOnly from,
        CancellationToken ct = default);
}
