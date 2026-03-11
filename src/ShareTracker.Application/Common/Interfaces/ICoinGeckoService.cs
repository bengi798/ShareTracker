namespace ShareTracker.Application.Common.Interfaces;

public interface ICoinGeckoService
{
    /// <summary>
    /// Returns AUD prices for the given coin symbols (e.g. "BTC", "ETH").
    /// Key is the uppercased symbol; value is null if price unavailable.
    /// </summary>
    Task<IReadOnlyDictionary<string, decimal?>> GetAudPricesAsync(
        IReadOnlyList<string> coinSymbols,
        CancellationToken ct = default);
}
