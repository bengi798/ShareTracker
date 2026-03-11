namespace ShareTracker.Domain.Entities;

public class Portfolio
{
    public Guid   Id        { get; private set; }
    public string UserId    { get; private set; } = string.Empty;
    public string Name      { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    // Required by EF Core
    protected Portfolio() { }

    public static Portfolio Create(string userId, string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Portfolio name must not be empty.");

        return new Portfolio
        {
            Id        = Guid.NewGuid(),
            UserId    = userId,
            Name      = name.Trim(),
            CreatedAt = DateTime.UtcNow,
        };
    }

    public void Update(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Portfolio name must not be empty.");

        Name = name.Trim();
    }
}
