namespace ShareTracker.Application.Common.Interfaces;

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
}
