using ShareTracker.Domain.ValueObjects;

namespace ShareTracker.Domain.Tests.ValueObjects;

public class TickerSymbolTests
{
    [Theory]
    [InlineData("AAPL")]
    [InlineData("BHP.AX")]
    [InlineData("A")]
    [InlineData("ABCDEFGHIJ")] // exactly 10 chars
    public void Create_WithValidSymbol_Succeeds(string symbol)
    {
        var ticker = TickerSymbol.Create(symbol);

        Assert.Equal(symbol.ToUpperInvariant(), ticker.Value);
    }

    [Theory]
    [InlineData("aapl")]
    [InlineData("Msft")]
    public void Create_WithLowercaseSymbol_ReturnsUppercase(string symbol)
    {
        var ticker = TickerSymbol.Create(symbol);

        Assert.Equal(symbol.ToUpperInvariant(), ticker.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithEmptyOrWhitespace_ThrowsArgumentException(string symbol)
    {
        Assert.Throws<ArgumentException>(() => TickerSymbol.Create(symbol));
    }

    [Fact]
    public void Create_WithSymbolExceeding10Chars_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => TickerSymbol.Create("ABCDEFGHIJK")); // 11 chars
    }

    [Fact]
    public void Equality_TwoTickersWithSameValue_AreEqual()
    {
        var a = TickerSymbol.Create("AAPL");
        var b = TickerSymbol.Create("aapl"); // different case — should normalise

        Assert.Equal(a, b);
    }

    [Fact]
    public void Equality_TwoTickersWithDifferentValues_AreNotEqual()
    {
        var a = TickerSymbol.Create("AAPL");
        var b = TickerSymbol.Create("MSFT");

        Assert.NotEqual(a, b);
    }

    [Fact]
    public void ToString_ReturnsValue()
    {
        var ticker = TickerSymbol.Create("AAPL");

        Assert.Equal("AAPL", ticker.ToString());
    }
}
