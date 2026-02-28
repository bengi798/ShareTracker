using ShareTracker.Application.Trades.Commands.CreateSharesTrade;

namespace ShareTracker.Application.Tests.Trades;

public class CreateSharesTradeCommandValidatorTests
{
    private readonly CreateSharesTradeCommandValidator _validator = new();

    private static CreateSharesTradeCommand ValidCommand() => new(
        TradeType:     "Buy",
        PricePerUnit:  195.50m,
        NumberOfUnits: 10m,
        DateOfTrade:   DateOnly.FromDateTime(DateTime.UtcNow),
        Ticker:        "AAPL",
        Exchange:      "NASDAQ",
        Currency:      "USD");

    [Fact]
    public async Task Validate_WithValidCommand_Passes()
    {
        var result = await _validator.ValidateAsync(ValidCommand());

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public async Task Validate_WithEmptyTicker_Fails(string? ticker)
    {
        var result = await _validator.ValidateAsync(ValidCommand() with { Ticker = ticker! });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Ticker");
    }

    [Fact]
    public async Task Validate_WithTickerExceeding10Chars_Fails()
    {
        var result = await _validator.ValidateAsync(ValidCommand() with { Ticker = "ABCDEFGHIJK" });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Ticker");
    }

    [Theory]
    [InlineData("A@PL")]
    [InlineData("AA PL")]
    public async Task Validate_WithNonAlphanumericTicker_Fails(string ticker)
    {
        var result = await _validator.ValidateAsync(ValidCommand() with { Ticker = ticker });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Ticker");
    }

    [Theory]
    [InlineData("NYSE")]
    [InlineData("NASDAQ")]
    [InlineData("ASX")]
    [InlineData("LSE")]
    [InlineData("TSX")]
    [InlineData("Other")]
    [InlineData("nasdaq")] // case-insensitive
    public async Task Validate_WithValidExchange_Passes(string exchange)
    {
        var result = await _validator.ValidateAsync(ValidCommand() with { Exchange = exchange });

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task Validate_WithInvalidExchange_Fails()
    {
        var result = await _validator.ValidateAsync(ValidCommand() with { Exchange = "UNKNOWN" });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Exchange");
    }

    [Theory]
    [InlineData("Buy")]
    [InlineData("Sell")]
    [InlineData("buy")]
    [InlineData("SELL")]
    public async Task Validate_WithValidTradeType_Passes(string tradeType)
    {
        var result = await _validator.ValidateAsync(ValidCommand() with { TradeType = tradeType });

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task Validate_WithInvalidTradeType_Fails()
    {
        var result = await _validator.ValidateAsync(ValidCommand() with { TradeType = "Hold" });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "TradeType");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public async Task Validate_WithNonPositiveNumberOfUnits_Fails(decimal quantity)
    {
        var result = await _validator.ValidateAsync(ValidCommand() with { NumberOfUnits = quantity });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "NumberOfUnits");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-0.01)]
    public async Task Validate_WithNonPositivePricePerUnit_Fails(decimal price)
    {
        var result = await _validator.ValidateAsync(ValidCommand() with { PricePerUnit = price });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "PricePerUnit");
    }

    [Fact]
    public async Task Validate_WithFutureDateOfTrade_Fails()
    {
        var future = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));

        var result = await _validator.ValidateAsync(ValidCommand() with { DateOfTrade = future });

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "DateOfTrade");
    }

    [Fact]
    public async Task Validate_WithTodayAsDateOfTrade_Passes()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var result = await _validator.ValidateAsync(ValidCommand() with { DateOfTrade = today });

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task Validate_WithPastDateOfTrade_Passes()
    {
        var past = new DateOnly(2000, 1, 1);

        var result = await _validator.ValidateAsync(ValidCommand() with { DateOfTrade = past });

        Assert.True(result.IsValid);
    }
}
