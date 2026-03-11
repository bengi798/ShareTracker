namespace ShareTracker.Application.Trades.DTOs;

public record CryptoQuoteDto(
    string    CoinSymbol,    // e.g. "BTC", "ETH"
    decimal?  LastClose,     // USD price from EODHD; null = unavailable
    decimal?  LastCloseAud,  // AUD price from CoinGecko; null = unavailable
    DateOnly? AsOf)          // null = price unavailable
{
    // Discriminant — mirrors the AssetType discriminator on TradeDto
    public string AssetType => "Crypto";
}
