using ShareTracker.Domain.Entities;

namespace ShareTracker.Domain.Interfaces.Repositories;

public interface IBondCouponPaymentRepository
{
    Task<BondCouponPayment?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<BondCouponPayment>> GetAllByUserIdAsync(string userId, CancellationToken ct = default);
    Task<IReadOnlyList<BondCouponPayment>> GetByBondTradeIdAsync(Guid bondTradeId, CancellationToken ct = default);
    Task AddAsync(BondCouponPayment payment, CancellationToken ct = default);
    void Remove(BondCouponPayment payment);
}
