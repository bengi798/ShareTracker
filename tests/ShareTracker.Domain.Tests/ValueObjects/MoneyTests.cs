using ShareTracker.Domain.ValueObjects;

namespace ShareTracker.Domain.Tests.ValueObjects;

public class MoneyTests
{
    [Theory]
    [InlineData(1.0)]
    [InlineData(0.0001)]
    [InlineData(195.50)]
    [InlineData(999999.9999)]
    public void Create_WithPositiveAmount_Succeeds(decimal amount)
    {
        var money = Money.Create(amount);

        Assert.Equal(Math.Round(amount, 4), money.Amount);
    }

    [Fact]
    public void Create_WithAmountRequiringRounding_RoundsTo4DecimalPlaces()
    {
        var money = Money.Create(1.23456789m);

        Assert.Equal(1.2346m, money.Amount);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100.50)]
    public void Create_WithZeroOrNegativeAmount_ThrowsArgumentException(decimal amount)
    {
        Assert.Throws<ArgumentException>(() => Money.Create(amount));
    }

    [Fact]
    public void Equality_TwoMoneyWithSameAmount_AreEqual()
    {
        var a = Money.Create(100m);
        var b = Money.Create(100m);

        Assert.Equal(a, b);
    }

    [Fact]
    public void Equality_TwoMoneyWithDifferentAmounts_AreNotEqual()
    {
        var a = Money.Create(100m);
        var b = Money.Create(200m);

        Assert.NotEqual(a, b);
    }
}
