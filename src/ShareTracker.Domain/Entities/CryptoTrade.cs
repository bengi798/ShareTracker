using ShareTracker.Domain.Enums;

namespace ShareTracker.Domain.Entities;

public class CryptoTrade : Trade
{
    public string CoinSymbol { get; private set; } = null!;
    public string? Network { get; private set; }
    public decimal? BrokerageFees { get; private set; }

    private CryptoTrade() : base() { }

    private CryptoTrade(
        string userId, decimal pricePerUnit, decimal numberOfUnits,
        DateOnly dateOfTrade, TradeType tradeType,
        string coinSymbol, string? network, Currency currency,
        bool isForeignTrade, decimal? exchangeRate, decimal? brokerageFees)
        : base(userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType, currency, isForeignTrade, exchangeRate)
    {
        CoinSymbol = coinSymbol;
        Network = network;
        BrokerageFees = brokerageFees;
    }

    public static CryptoTrade Create(
        string userId,
        decimal pricePerUnit,
        decimal numberOfUnits,
        DateOnly dateOfTrade,
        TradeType tradeType,
        string coinSymbol,
        string? network = null,
        Currency currency = Currency.USD,
        bool isForeignTrade = false,
        decimal? exchangeRate = null,
        decimal? brokerageFees = null)
    {
        if (string.IsNullOrWhiteSpace(coinSymbol))
            throw new ArgumentException("Coin symbol must not be empty.");
        if (brokerageFees.HasValue && brokerageFees.Value < 0)
            throw new ArgumentException("Brokerage fees cannot be negative.");

        return new CryptoTrade(
            userId, pricePerUnit, numberOfUnits, dateOfTrade, tradeType,
            coinSymbol.ToUpperInvariant(), network, currency, isForeignTrade, exchangeRate, brokerageFees);
    }
}
