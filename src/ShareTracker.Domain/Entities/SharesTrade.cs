using ShareTracker.Domain.Enums;
using ShareTracker.Domain.ValueObjects;

namespace ShareTracker.Domain.Entities;

public class SharesTrade : Trade
{
    public TickerSymbol Ticker { get; private set; } = null!;
    public Exchange Exchange { get; private set; }
    public decimal? BrokerageFees { get; private set; }

    private SharesTrade() : base() { }

    private SharesTrade(
        string userId, decimal pricePerUnit, decimal numberOfUnits,
        DateOnly dateOfTrade, TradeType tradeType,
        TickerSymbol ticker, Exchange exchange, Currency currency,
        bool isForeignTrade, decimal? exchangeRate, decimal? brokerageFees,
        decimal? totalCostHome = null)
        : base(userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType, currency, isForeignTrade, exchangeRate, totalCostHome)
    {
        Ticker = ticker;
        Exchange = exchange;
        BrokerageFees = brokerageFees;
    }

    public void Update(
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        string ticker,
        Exchange exchange,
        Currency currency,
        bool isForeignTrade = false,
        decimal? exchangeRate = null,
        decimal? brokerageFees = null,
        decimal? totalCostHome = null)
    {
        if (brokerageFees.HasValue && brokerageFees.Value < 0)
            throw new ArgumentException("Brokerage fees cannot be negative.");

        UpdateBase(pricePerUnit, numberOfUnits, dateOfTrade, currency, isForeignTrade, exchangeRate, totalCostHome);
        Ticker = TickerSymbol.Create(ticker);
        Exchange = exchange;
        BrokerageFees = brokerageFees;
    }

    public static SharesTrade Create(
        string userId,
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        TradeType tradeType,
        string ticker,
        Exchange exchange,
        Currency currency,
        bool isForeignTrade = false,
        decimal? exchangeRate = null,
        decimal? brokerageFees = null,
        decimal? totalCostHome = null)
    {
        if (brokerageFees.HasValue && brokerageFees.Value < 0)
            throw new ArgumentException("Brokerage fees cannot be negative.");

        return new SharesTrade(
            userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType,
            TickerSymbol.Create(ticker), exchange, currency, isForeignTrade, exchangeRate, brokerageFees, totalCostHome);
    }
}
