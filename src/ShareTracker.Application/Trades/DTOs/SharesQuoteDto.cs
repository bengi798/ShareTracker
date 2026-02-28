namespace ShareTracker.Application.Trades.DTOs;

public record SharesQuoteDto(
    string    Ticker,
    string    Exchange,
    decimal?  LastClose,   // null = price unavailable
    DateOnly? AsOf)        // null = price unavailable
{
    // Discriminant — mirrors the AssetType discriminator on TradeDto
    public string AssetType => "Shares";
}
