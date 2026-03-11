using ShareTracker.Domain.Entities;

namespace ShareTracker.Domain.Interfaces.Repositories;

public interface ITradeRepository
{
    Task<Trade?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Trade>> GetAllByUserIdAsync(string userId, CancellationToken ct = default);
    Task AddAsync(Trade trade, CancellationToken ct = default);
    void Remove(Trade trade);
    Task<IReadOnlyList<Trade>> GetByPortfolioIdAsync(Guid portfolioId, CancellationToken ct = default);
}
