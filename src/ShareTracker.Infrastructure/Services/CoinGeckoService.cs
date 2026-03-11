using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using ShareTracker.Application.Common.Interfaces;

namespace ShareTracker.Infrastructure.Services;

public class CoinGeckoService : ICoinGeckoService
{
    // Map uppercase ticker symbol → CoinGecko ID for common cryptos
    private static readonly Dictionary<string, string> SymbolToId = new(StringComparer.OrdinalIgnoreCase)
    {
        ["BTC"]  = "bitcoin",
        ["ETH"]  = "ethereum",
        ["BNB"]  = "binancecoin",
        ["SOL"]  = "solana",
        ["XRP"]  = "ripple",
        ["ADA"]  = "cardano",
        ["DOGE"] = "dogecoin",
        ["DOT"]  = "polkadot",
        ["LINK"] = "chainlink",
        ["MATIC"]= "matic-network",
        ["UNI"]  = "uniswap",
        ["LTC"]  = "litecoin",
        ["AVAX"] = "avalanche-2",
        ["ATOM"] = "cosmos",
        ["XLM"]  = "stellar",
        ["USDT"] = "tether",
        ["USDC"] = "usd-coin",
        ["SHIB"] = "shiba-inu",
        ["TRX"]  = "tron",
        ["NEAR"] = "near",
    };

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private readonly IHttpClientFactory       _httpFactory;
    private readonly IMemoryCache             _cache;
    private readonly ILogger<CoinGeckoService> _logger;

    public CoinGeckoService(
        IHttpClientFactory        httpFactory,
        IMemoryCache              cache,
        ILogger<CoinGeckoService> logger)
    {
        _httpFactory = httpFactory;
        _cache       = cache;
        _logger      = logger;
    }

    public async Task<IReadOnlyDictionary<string, decimal?>> GetAudPricesAsync(
        IReadOnlyList<string> coinSymbols,
        CancellationToken ct = default)
    {
        var result = new Dictionary<string, decimal?>();
        var toFetch = new List<(string Symbol, string CoinGeckoId)>();

        foreach (var symbol in coinSymbols.Select(s => s.ToUpperInvariant()).Distinct())
        {
            var cacheKey = $"coingecko:aud:{symbol}";
            if (_cache.TryGetValue(cacheKey, out decimal? cached))
            {
                result[symbol] = cached;
                continue;
            }

            if (SymbolToId.TryGetValue(symbol, out var id))
                toFetch.Add((symbol, id));
            else
                result[symbol] = null; // unknown symbol
        }

        if (toFetch.Count == 0)
            return result;

        try
        {
            var ids = string.Join(",", toFetch.Select(x => x.CoinGeckoId));
            var url = $"https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=aud";

            var client   = _httpFactory.CreateClient("coingecko");
            var response = await client.GetAsync(url, ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("CoinGecko returned {StatusCode}", response.StatusCode);
                foreach (var (sym, _) in toFetch) result[sym] = null;
                return result;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            // Response shape: { "bitcoin": { "aud": 95000.5 }, "ethereum": { "aud": 4200.0 } }
            var data = JsonSerializer.Deserialize<Dictionary<string, CoinGeckoPriceEntry>>(json, JsonOpts);

            foreach (var (symbol, geckoId) in toFetch)
            {
                decimal? price = data?.TryGetValue(geckoId, out var entry) == true ? entry.Aud : null;
                result[symbol] = price;
                _cache.Set($"coingecko:aud:{symbol}", price, TimeSpan.FromMinutes(5));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch CoinGecko AUD prices");
            foreach (var (sym, _) in toFetch) result[sym] = null;
        }

        return result;
    }

    private record CoinGeckoPriceEntry(
        [property: JsonPropertyName("aud")] decimal? Aud);
}
