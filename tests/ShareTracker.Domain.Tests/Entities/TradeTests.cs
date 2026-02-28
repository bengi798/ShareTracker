using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;

namespace ShareTracker.Domain.Tests.Entities;

public class SharesTradeTests
{
    private static readonly string _userId = "user_test123";

    [Fact]
    public void Create_WithValidData_SetsAllPropertiesCorrectly()
    {
        var dateOfTrade = new DateOnly(2024, 6, 15);

        var trade = SharesTrade.Create(
            userId:        _userId,
            pricePerUnit:  195.50m,
            numberOfUnits: 10m,
            dateOfTrade:   dateOfTrade,
            tradeType:     TradeType.Buy,
            ticker:        "aapl",
            exchange:      Exchange.NASDAQ,
            currency:      Currency.USD,
            isForeignTrade: true,
            exchangeRate:  1.25m
        );

        Assert.NotEqual(Guid.Empty, trade.Id); // Trade.Id is still a Guid
        Assert.Equal(_userId, trade.UserId);
        Assert.Equal("AAPL", trade.Ticker.Value); // uppercased by TickerSymbol
        Assert.Equal(Exchange.NASDAQ, trade.Exchange);
        Assert.Equal(TradeType.Buy, trade.TradeType);
        Assert.Equal(10m, trade.NumberOfUnits);
        Assert.Equal(195.50m, trade.PricePerUnit);
        Assert.Equal(dateOfTrade, trade.DateOfTrade);
        Assert.True(trade.CreatedAt <= DateTime.UtcNow);
        Assert.True(trade.CreatedAt > DateTime.UtcNow.AddSeconds(-5));
        Assert.True(trade.IsForeignTrade);
        Assert.True(trade.ExchangeRateApplied);
        Assert.Equal(1.25m, trade.ExchangeRate);
    }

    [Fact]
    public void TotalValue_IsProductOfPricePerUnitAndNumberOfUnits()
    {
        var trade = SharesTrade.Create(
            _userId, 100m, 5m, DateOnly.FromDateTime(DateTime.Today),
            TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD, false, 1m);

        Assert.Equal(500m, trade.TotalValue);
    }

    [Fact]
    public void Create_EachCallProducesUniqueId()
    {
        var trade1 = SharesTrade.Create(_userId, 100m, 1m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD, false, 1m);
        var trade2 = SharesTrade.Create(_userId, 100m, 1m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD, false, 1m);

        Assert.NotEqual(trade1.Id, trade2.Id);
    }

    [Fact]
    public void Create_WithInvalidTicker_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            SharesTrade.Create(_userId, 100m, 1m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "", Exchange.NASDAQ, Currency.USD, false, 1m));
    }

    [Fact]
    public void Create_WithZeroNumberOfUnits_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            SharesTrade.Create(_userId, 100m, 0m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD, false, 1m));
    }

    [Fact]
    public void Create_WithZeroPricePerUnit_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            SharesTrade.Create(_userId, 0m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD, false, 1m));
    }

    [Fact]
    public void Create_WithZeroExchangeRate_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD, true, 0m));
    }

    [Fact]
    public void Create_WithNoExchangeRateWhenForeignTrade_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD, true, null));
    }

    // ── NumberOfUnitsSold initialisation ──────────────────────────────

    [Fact]
    public void Create_BuyTrade_NumberOfUnitsSoldIsZero()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);

        Assert.Equal(0m, trade.NumberOfUnitsSold);
    }

    [Fact]
    public void Create_SellTrade_NumberOfUnitsSoldIsNull()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Sell, "AAPL", Exchange.NASDAQ, Currency.USD);

        Assert.Null(trade.NumberOfUnitsSold);
    }

    // ── AllocateSoldUnits ─────────────────────────────────────────────

    [Fact]
    public void AllocateSoldUnits_PartialAllocation_UpdatesNumberOfUnitsSold()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);

        trade.AllocateSoldUnits(4m);

        Assert.Equal(4m, trade.NumberOfUnitsSold);
    }

    [Fact]
    public void AllocateSoldUnits_FullAllocation_NumberOfUnitsSoldEqualsNumberOfUnits()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);

        trade.AllocateSoldUnits(10m);

        Assert.Equal(10m, trade.NumberOfUnitsSold);
    }

    [Fact]
    public void AllocateSoldUnits_MultipleAllocations_Accumulates()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);

        trade.AllocateSoldUnits(3m);
        trade.AllocateSoldUnits(5m);

        Assert.Equal(8m, trade.NumberOfUnitsSold);
    }

    [Fact]
    public void AllocateSoldUnits_ExceedsNumberOfUnits_ThrowsInvalidOperationException()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);

        Assert.Throws<InvalidOperationException>(() => trade.AllocateSoldUnits(11m));
    }

    [Fact]
    public void AllocateSoldUnits_SecondAllocationExceedsRemaining_Throws()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);
        trade.AllocateSoldUnits(8m);

        Assert.Throws<InvalidOperationException>(() => trade.AllocateSoldUnits(3m));
    }

    [Fact]
    public void AllocateSoldUnits_ZeroUnits_ThrowsArgumentException()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Buy, "AAPL", Exchange.NASDAQ, Currency.USD);

        Assert.Throws<ArgumentException>(() => trade.AllocateSoldUnits(0m));
    }

    [Fact]
    public void AllocateSoldUnits_OnSellTrade_ThrowsInvalidOperationException()
    {
        var trade = SharesTrade.Create(_userId, 100m, 10m, DateOnly.FromDateTime(DateTime.Today), TradeType.Sell, "AAPL", Exchange.NASDAQ, Currency.USD);

        Assert.Throws<InvalidOperationException>(() => trade.AllocateSoldUnits(5m));
    }
}
