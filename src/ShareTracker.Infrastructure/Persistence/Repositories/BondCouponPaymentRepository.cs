using Microsoft.EntityFrameworkCore;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Infrastructure.Persistence.Repositories;

public class BondCouponPaymentRepository : IBondCouponPaymentRepository
{
    private readonly ShareTrackerDbContext _context;

    public BondCouponPaymentRepository(ShareTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<BondCouponPayment?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.BondCouponPayments.FindAsync([id], ct);

    public async Task<IReadOnlyList<BondCouponPayment>> GetAllByUserIdAsync(string userId, CancellationToken ct = default) =>
        await _context.BondCouponPayments
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<BondCouponPayment>> GetByBondTradeIdAsync(Guid bondTradeId, CancellationToken ct = default) =>
        await _context.BondCouponPayments
            .Where(p => p.BondTradeId == bondTradeId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync(ct);

    public async Task AddAsync(BondCouponPayment payment, CancellationToken ct = default) =>
        await _context.BondCouponPayments.AddAsync(payment, ct);

    public void Remove(BondCouponPayment payment) =>
        _context.BondCouponPayments.Remove(payment);
}
