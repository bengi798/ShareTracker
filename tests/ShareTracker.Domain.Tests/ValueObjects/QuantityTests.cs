using ShareTracker.Domain.ValueObjects;

namespace ShareTracker.Domain.Tests.ValueObjects;

public class QuantityTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(0.5)]
    [InlineData(1000)]
    [InlineData(0.0001)]
    public void Create_WithPositiveValue_Succeeds(decimal value)
    {
        var quantity = Quantity.Create(value);

        Assert.Equal(value, quantity.Value);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-0.001)]
    public void Create_WithZeroOrNegative_ThrowsArgumentException(decimal value)
    {
        Assert.Throws<ArgumentException>(() => Quantity.Create(value));
    }

    [Fact]
    public void Equality_TwoQuantitiesWithSameValue_AreEqual()
    {
        var a = Quantity.Create(10m);
        var b = Quantity.Create(10m);

        Assert.Equal(a, b);
    }

    [Fact]
    public void Equality_TwoQuantitiesWithDifferentValues_AreNotEqual()
    {
        var a = Quantity.Create(10m);
        var b = Quantity.Create(20m);

        Assert.NotEqual(a, b);
    }
}
