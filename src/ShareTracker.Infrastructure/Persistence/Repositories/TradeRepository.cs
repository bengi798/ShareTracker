using Microsoft.EntityFrameworkCore;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Infrastructure.Persistence.Repositories;

public class TradeRepository : ITradeRepository
{
    private readonly ShareTrackerDbContext _context;

    public TradeRepository(ShareTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<Trade?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Trades.FindAsync([id], ct);

    public async Task<IReadOnlyList<Trade>> GetAllByUserIdAsync(string userId, CancellationToken ct = default) =>
        await _context.Trades
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.DateOfTrade)
            .ToListAsync(ct);

    public async Task AddAsync(Trade trade, CancellationToken ct = default) =>
        await _context.Trades.AddAsync(trade, ct);

    public void Remove(Trade trade) =>
        _context.Trades.Remove(trade);

    public async Task<IReadOnlyList<Trade>> GetByPortfolioIdAsync(Guid portfolioId, CancellationToken ct = default) =>
        await _context.Trades
            .Where(t => t.PortfolioId == portfolioId)
            .ToListAsync(ct);
}
