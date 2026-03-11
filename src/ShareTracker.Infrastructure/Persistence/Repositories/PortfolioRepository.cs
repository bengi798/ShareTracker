using Microsoft.EntityFrameworkCore;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Infrastructure.Persistence.Repositories;

public class PortfolioRepository : IPortfolioRepository
{
    private readonly ShareTrackerDbContext _context;

    public PortfolioRepository(ShareTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<Portfolio?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Portfolios.FindAsync([id], ct);

    public async Task<IReadOnlyList<Portfolio>> GetAllByUserIdAsync(string userId, CancellationToken ct = default) =>
        await _context.Portfolios
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Portfolio portfolio, CancellationToken ct = default) =>
        await _context.Portfolios.AddAsync(portfolio, ct);

    public void Remove(Portfolio portfolio) =>
        _context.Portfolios.Remove(portfolio);
}
