namespace ShareTracker.Domain.ValueObjects;

public sealed class TickerSymbol : ValueObject
{
    public string Value { get; }

    private TickerSymbol(string value) => Value = value;

    public static TickerSymbol Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Ticker symbol cannot be empty.");

        var upper = value.Trim().ToUpperInvariant();

        if (upper.Length > 10)
            throw new ArgumentException("Ticker symbol cannot exceed 10 characters.");

        return new TickerSymbol(upper);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString() => Value;
}
