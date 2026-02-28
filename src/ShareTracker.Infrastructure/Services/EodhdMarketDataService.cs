using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ShareTracker.Application.Common.Interfaces;

namespace ShareTracker.Infrastructure.Services;

public class EodhdMarketDataService : IMarketDataService
{
    private readonly IHttpClientFactory       _httpFactory;
    private readonly EodhdSettings            _settings;
    private readonly IMemoryCache             _cache;
    private readonly ILogger<EodhdMarketDataService> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public EodhdMarketDataService(
        IHttpClientFactory               httpFactory,
        IOptions<EodhdSettings>          settings,
        IMemoryCache                     cache,
        ILogger<EodhdMarketDataService>  logger)
    {
        _httpFactory = httpFactory;
        _settings    = settings.Value;
        _cache       = cache;
        _logger      = logger;
    }

    public async Task<IReadOnlyDictionary<string, decimal?>> GetLatestClosingPricesAsync(
        IReadOnlyList<(string Ticker, string ExchangeCode)> symbols,
        CancellationToken ct = default)
    {
        var result = new Dictionary<string, decimal?>();
        var today  = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var (ticker, exchangeCode) in symbols)
        {
            var canonicalKey = $"{ticker.ToUpperInvariant()}.{exchangeCode}";
            var cacheKey     = $"eodhd:{canonicalKey}:{today}";

            if (!_cache.TryGetValue(cacheKey, out decimal? price))
            {
                price = await FetchClosingPriceAsync(ticker, exchangeCode, ct);

                // Cache until midnight UTC — whether successful or null.
                // Caching null prevents burning API calls on bad symbols on every request.
                var expiresIn = DateTime.UtcNow.Date.AddDays(1) - DateTime.UtcNow;
                _cache.Set(cacheKey, price, expiresIn);
            }

            result[canonicalKey] = price;
        }

        return result;
    }

    private async Task<decimal?> FetchClosingPriceAsync(
        string ticker, string exchangeCode, CancellationToken ct)
    {
        try
        {
            var yesterday = DateTime.UtcNow.AddDays(-5).ToString("yyyy-MM-dd"); // look back up to 5 days (weekends/holidays)
            var today     = DateTime.UtcNow.ToString("yyyy-MM-dd");

            var url = $"{_settings.BaseUrl}/eod/{Uri.EscapeDataString(ticker.ToUpperInvariant())}.{exchangeCode}" +
                      $"?api_token={_settings.ApiToken}&fmt=json&from={yesterday}&to={today}&order=d";

            var client   = _httpFactory.CreateClient("eodhd");
            var response = await client.GetAsync(url, ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "EODHD returned {StatusCode} for {Ticker}.{Exchange}",
                    response.StatusCode, ticker, exchangeCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            var bars = JsonSerializer.Deserialize<EodhdBar[]>(json, JsonOpts);

            // Response ordered by date descending (order=d), so first element is most recent
            var latest = bars?.FirstOrDefault(b => b.Close.HasValue);
            if (latest is null)
            {
                _logger.LogWarning(
                    "EODHD returned no price data for {Ticker}.{Exchange}", ticker, exchangeCode);
                return null;
            }

            return latest.Close;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to fetch EODHD price for {Ticker}.{Exchange}", ticker, exchangeCode);
            return null;
        }
    }

    // ── EODHD JSON response shape ─────────────────────────────────────────────
    private record EodhdBar(
        [property: JsonPropertyName("date")]           string?  Date,
        [property: JsonPropertyName("open")]           decimal? Open,
        [property: JsonPropertyName("high")]           decimal? High,
        [property: JsonPropertyName("low")]            decimal? Low,
        [property: JsonPropertyName("close")]          decimal? Close,
        [property: JsonPropertyName("adjusted_close")] decimal? AdjustedClose,
        [property: JsonPropertyName("volume")]         long?    Volume);
}
