using ShareTracker.Domain.Entities;

namespace ShareTracker.Domain.Interfaces.Repositories;

public interface IPortfolioRepository
{
    Task<Portfolio?>                    GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Portfolio>>      GetAllByUserIdAsync(string userId, CancellationToken ct = default);
    Task                                AddAsync(Portfolio portfolio, CancellationToken ct = default);
    void                                Remove(Portfolio portfolio);
}
