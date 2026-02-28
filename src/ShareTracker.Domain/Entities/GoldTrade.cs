using ShareTracker.Domain.Enums;

namespace ShareTracker.Domain.Entities;

public class GoldTrade : Trade
{
    public int PurityCarats { get; private set; }
    public WeightUnit WeightUnit { get; private set; }

    private GoldTrade() : base() { }

    private GoldTrade(
        string userId, decimal pricePerUnit, decimal numberOfUnits,
        DateOnly dateOfTrade, TradeType tradeType,
        int purityCarats, WeightUnit weightUnit, Currency currency,
        bool isForeignTrade, decimal? exchangeRate)
        : base(userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType, currency, isForeignTrade, exchangeRate)
    {
        PurityCarats = purityCarats;
        WeightUnit = weightUnit;
    }

    public static GoldTrade Create(
        string userId,
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        TradeType tradeType,
        int purityCarats,
        WeightUnit weightUnit,
        Currency currency,
        bool isForeignTrade = false,
        decimal? exchangeRate = null)
    {
        if (purityCarats is < 1 or > 24)
            throw new ArgumentException("Purity carats must be between 1 and 24.");

        return new GoldTrade(
            userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType,
            purityCarats, weightUnit, currency, isForeignTrade, exchangeRate);
    }
}
