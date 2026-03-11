using Microsoft.EntityFrameworkCore;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Infrastructure.Persistence;

public class ShareTrackerDbContext : DbContext
{
    public DbSet<Trade>             Trades             => Set<Trade>();
    public DbSet<UserProfile>       UserProfiles       => Set<UserProfile>();
    public DbSet<Portfolio>         Portfolios         => Set<Portfolio>();
    public DbSet<BondCouponPayment> BondCouponPayments => Set<BondCouponPayment>();

    public ShareTrackerDbContext(DbContextOptions<ShareTrackerDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ShareTrackerDbContext).Assembly);
    }
}
