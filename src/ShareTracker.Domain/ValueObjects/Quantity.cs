namespace ShareTracker.Domain.ValueObjects;

public sealed class Quantity : ValueObject
{
    public decimal Value { get; }

    private Quantity(decimal value) => Value = value;

    public static Quantity Create(decimal value)
    {
        if (value <= 0)
            throw new ArgumentException("Quantity must be greater than zero.");

        return new Quantity(value);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
