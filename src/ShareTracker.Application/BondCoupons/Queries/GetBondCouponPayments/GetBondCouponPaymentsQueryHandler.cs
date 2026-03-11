using MediatR;
using ShareTracker.Application.BondCoupons.Commands.CreateBondCouponPayment;
using ShareTracker.Application.BondCoupons.DTOs;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.BondCoupons.Queries.GetBondCouponPayments;

public class GetBondCouponPaymentsQueryHandler
    : IRequestHandler<GetBondCouponPaymentsQuery, IReadOnlyList<BondCouponPaymentDto>>
{
    private readonly IBondCouponPaymentRepository _repo;
    private readonly ICurrentUserService          _currentUser;

    public GetBondCouponPaymentsQueryHandler(
        IBondCouponPaymentRepository repo,
        ICurrentUserService          currentUser)
    {
        _repo        = repo;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<BondCouponPaymentDto>> Handle(
        GetBondCouponPaymentsQuery request, CancellationToken cancellationToken)
    {
        var payments = await _repo.GetAllByUserIdAsync(_currentUser.UserId, cancellationToken);
        return payments.Select(CreateBondCouponPaymentCommandHandler.ToDto).ToList();
    }
}
