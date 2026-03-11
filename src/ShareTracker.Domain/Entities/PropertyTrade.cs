using ShareTracker.Domain.Enums;

namespace ShareTracker.Domain.Entities;

public class PropertyTrade : Trade
{
    public string Address { get; private set; } = null!;
    public PropertyType PropertyType { get; private set; }

    private PropertyTrade() : base() { }

    private PropertyTrade(
        string userId, decimal pricePerUnit, decimal numberOfUnits,
        DateOnly dateOfTrade, TradeType tradeType,
        string address, PropertyType propertyType, Currency currency,
        bool isForeignTrade, decimal? exchangeRate, decimal? totalCostHome = null)
        : base(userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType, currency, isForeignTrade, exchangeRate, totalCostHome)
    {
        Address = address;
        PropertyType = propertyType;
    }

    public void Update(
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        string address,
        PropertyType propertyType,
        Currency currency,
        bool isForeignTrade = false,
        decimal? exchangeRate = null,
        decimal? totalCostHome = null)
    {
        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Address must not be empty.");

        UpdateBase(pricePerUnit, numberOfUnits, dateOfTrade, currency, isForeignTrade, exchangeRate, totalCostHome);
        Address = address;
        PropertyType = propertyType;
    }

    public static PropertyTrade Create(
        string userId,
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        TradeType tradeType,
        string address,
        PropertyType propertyType,
        Currency currency,
        bool isForeignTrade = false,
        decimal? exchangeRate = null,
        decimal? totalCostHome = null)
    {
        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Address must not be empty.");

        return new PropertyTrade(
            userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType,
            address, propertyType, currency, isForeignTrade, exchangeRate, totalCostHome);
    }
}
