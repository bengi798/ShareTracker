using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Infrastructure.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ShareTrackerDbContext _context;

    public UnitOfWork(ShareTrackerDbContext context)
    {
        _context = context;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        _context.SaveChangesAsync(ct);
}
