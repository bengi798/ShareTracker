namespace ShareTracker.Application.Trades.DTOs;

public record GoldQuoteDto(
    int      PurityCarats,   // e.g. 18, 24
    string   WeightUnit,     // Grams | TroyOunces | Tolas
    decimal  NetUnits,       // total units held
    decimal? SpotUsdPerTroyOz, // raw XAUUSD price
    decimal? PricePerUnit,   // adjusted for purity + weight unit, in USD
    DateOnly? AsOf)
{
    public string AssetType => "Gold";
}
