using ShareTracker.Domain.Enums;

namespace ShareTracker.Domain.Entities;

public class BondTrade : Trade
{
    public string BondCode { get; private set; } = null!;
    public decimal YieldPercent { get; private set; }
    public DateOnly MaturityDate { get; private set; }
    public string Issuer { get; private set; } = null!;

    private BondTrade() : base() { }

    private BondTrade(
        string userId, decimal pricePerUnit, decimal numberOfUnits,
        DateOnly dateOfTrade, TradeType tradeType,
        string bondCode, decimal yieldPercent, DateOnly maturityDate, string issuer, Currency currency,
        bool isForeignTrade, decimal? exchangeRate, decimal? totalCostHome = null)
        : base(userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType, currency, isForeignTrade, exchangeRate, totalCostHome)
    {
        BondCode = bondCode;
        YieldPercent = yieldPercent;
        MaturityDate = maturityDate;
        Issuer = issuer;
    }

    public void Update(
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        string bondCode,
        decimal yieldPercent,
        DateOnly maturityDate,
        string issuer,
        Currency currency,
        bool isForeignTrade = false,
        decimal? exchangeRate = null,
        decimal? totalCostHome = null)
    {
        if (string.IsNullOrWhiteSpace(bondCode))
            throw new ArgumentException("Bond code must not be empty.");
        if (yieldPercent <= 0)
            throw new ArgumentException("Yield percent must be greater than zero.");
        if (string.IsNullOrWhiteSpace(issuer))
            throw new ArgumentException("Issuer must not be empty.");

        UpdateBase(pricePerUnit, numberOfUnits, dateOfTrade, currency, isForeignTrade, exchangeRate, totalCostHome);
        BondCode = bondCode.ToUpperInvariant();
        YieldPercent = yieldPercent;
        MaturityDate = maturityDate;
        Issuer = issuer;
    }

    public static BondTrade Create(
        string userId,
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        TradeType tradeType,
        string bondCode,
        decimal yieldPercent,
        DateOnly maturityDate,
        string issuer,
        Currency currency,
        bool isForeignTrade = false,
        decimal? exchangeRate = null,
        decimal? totalCostHome = null)
    {
        if (string.IsNullOrWhiteSpace(bondCode))
            throw new ArgumentException("Bond code must not be empty.");
        if (yieldPercent <= 0)
            throw new ArgumentException("Yield percent must be greater than zero.");
        if (string.IsNullOrWhiteSpace(issuer))
            throw new ArgumentException("Issuer must not be empty.");

        return new BondTrade(
            userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType,
            bondCode.ToUpperInvariant(), yieldPercent, maturityDate, issuer, currency,
            isForeignTrade, exchangeRate, totalCostHome);
    }
}
