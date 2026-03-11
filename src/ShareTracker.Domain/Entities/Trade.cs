using ShareTracker.Domain.Enums;
using ShareTracker.Domain.ValueObjects;

namespace ShareTracker.Domain.Entities;

public abstract class Trade
{
    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public decimal PricePerUnit { get; private set; }
    public decimal NumberOfUnits { get; private set; }
    public decimal? NumberOfUnitsSold { get; private set; }
    public decimal TotalValue => Math.Round(PricePerUnit * NumberOfUnits, 4);
    public TradeType TradeType { get; private set; }
    public Currency Currency { get; private set; }
    public DateOnly DateOfTrade { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public Guid? PortfolioId { get; private set; }
    public bool IsForeignTrade { get; private set; }
    public bool ExchangeRateApplied { get; private set; }
    public decimal? ExchangeRate { get; private set; }
    public decimal? TotalCostHome { get; private set; }

    // Required by EF Core
    protected Trade() { }

    protected Trade(
        string userId,
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        TradeType tradeType,
        Currency currency,
        bool isForeignTrade = false,
        decimal? exchangeRate = null,
        decimal? totalCostHome = null)
    {
        // Use value objects for validation + rounding
        var price = Money.Create(pricePerUnit);
        var units = Quantity.Create(numberOfUnits);
        Currency = currency;
        // Only buy trades track how many of their units have been sold
        NumberOfUnitsSold = tradeType == TradeType.Buy ? 0m : null;

        Id = Guid.NewGuid();
        UserId = userId;
        PricePerUnit = price.Amount;
        NumberOfUnits = units.Value;
        DateOfTrade = dateOfTrade;
        TradeType = tradeType;
        CreatedAt = DateTime.UtcNow;
        if (isForeignTrade && (!exchangeRate.HasValue || exchangeRate <= 0))
            throw new ArgumentException("A positive exchange rate must be provided for foreign trades.");

        IsForeignTrade = isForeignTrade;
        ExchangeRate = isForeignTrade ? exchangeRate : null;
        ExchangeRateApplied = isForeignTrade && exchangeRate.HasValue;
        TotalCostHome = isForeignTrade ? totalCostHome : null;
    }

    protected void UpdateBase(
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        Currency currency,
        bool isForeignTrade,
        decimal? exchangeRate,
        decimal? totalCostHome = null)
    {
        var price = Money.Create(pricePerUnit);
        var units = Quantity.Create(numberOfUnits);

        PricePerUnit = price.Amount;
        NumberOfUnits = units.Value;
        DateOfTrade = dateOfTrade;
        Currency = currency;

        if (isForeignTrade && (!exchangeRate.HasValue || exchangeRate <= 0))
            throw new ArgumentException("A positive exchange rate must be provided for foreign trades.");

        IsForeignTrade = isForeignTrade;
        ExchangeRate = isForeignTrade ? exchangeRate : null;
        ExchangeRateApplied = isForeignTrade && exchangeRate.HasValue;
        TotalCostHome = isForeignTrade ? totalCostHome : null;
    }

    /// <summary>
    /// Allocates <paramref name="units"/> sold against this buy trade (FIFO bookkeeping).
    /// Only valid on Buy trades. Throws if allocation would exceed NumberOfUnits.
    /// </summary>
    public void SetPortfolio(Guid? portfolioId) => PortfolioId = portfolioId;

    public void AllocateSoldUnits(decimal units)
    {
        if (TradeType != TradeType.Buy)
            throw new InvalidOperationException("Sold-unit allocation is only valid for Buy trades.");
        if (units <= 0)
            throw new ArgumentException("Units to allocate must be greater than zero.", nameof(units));

        var alreadySold = NumberOfUnitsSold ?? 0m;
        if (alreadySold + units > NumberOfUnits)
            throw new InvalidOperationException(
                $"Cannot allocate {units} units: only {NumberOfUnits - alreadySold} remain on this buy trade.");

        NumberOfUnitsSold = alreadySold + units;
    }
}
