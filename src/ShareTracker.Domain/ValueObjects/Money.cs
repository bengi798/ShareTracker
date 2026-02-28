namespace ShareTracker.Domain.ValueObjects;

public sealed class Money : ValueObject
{
    public decimal Amount { get; }

    private Money(decimal amount) => Amount = amount;

    public static Money Create(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Price must be greater than zero.");

        return new Money(Math.Round(amount, 4));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
    }
}
