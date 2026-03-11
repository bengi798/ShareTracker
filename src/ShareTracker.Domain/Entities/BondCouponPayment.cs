namespace ShareTracker.Domain.Entities;

public class BondCouponPayment
{
    public Guid     Id          { get; private set; }
    public string   UserId      { get; private set; } = string.Empty;
    public Guid     BondTradeId { get; private set; }
    public DateOnly PaymentDate { get; private set; }
    public decimal  Amount      { get; private set; }
    public string   Currency    { get; private set; } = string.Empty;
    public string?  Notes       { get; private set; }
    public DateTime CreatedAt   { get; private set; }

    // Navigation property
    public BondTrade? BondTrade { get; private set; }

    // Required by EF Core
    private BondCouponPayment() { }

    private BondCouponPayment(
        string userId, Guid bondTradeId, DateOnly paymentDate,
        decimal amount, string currency, string? notes)
    {
        if (amount <= 0)
            throw new ArgumentException("Coupon payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("Currency is required.");

        Id          = Guid.NewGuid();
        UserId      = userId;
        BondTradeId = bondTradeId;
        PaymentDate = paymentDate;
        Amount      = amount;
        Currency    = currency.ToUpperInvariant();
        Notes       = notes;
        CreatedAt   = DateTime.UtcNow;
    }

    public static BondCouponPayment Create(
        string userId, Guid bondTradeId, DateOnly paymentDate,
        decimal amount, string currency, string? notes = null)
        => new(userId, bondTradeId, paymentDate, amount, currency, notes);

    public void Update(DateOnly paymentDate, decimal amount, string currency, string? notes)
    {
        if (amount <= 0)
            throw new ArgumentException("Coupon payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("Currency is required.");

        PaymentDate = paymentDate;
        Amount      = amount;
        Currency    = currency.ToUpperInvariant();
        Notes       = notes;
    }
}
