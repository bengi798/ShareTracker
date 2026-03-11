using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.BondCoupons.Commands.DeleteBondCouponPayment;

public class DeleteBondCouponPaymentCommandHandler : IRequestHandler<DeleteBondCouponPaymentCommand>
{
    private readonly IBondCouponPaymentRepository _repo;
    private readonly ICurrentUserService          _currentUser;
    private readonly IUnitOfWork                  _unitOfWork;

    public DeleteBondCouponPaymentCommandHandler(
        IBondCouponPaymentRepository repo,
        ICurrentUserService          currentUser,
        IUnitOfWork                  unitOfWork)
    {
        _repo        = repo;
        _currentUser = currentUser;
        _unitOfWork  = unitOfWork;
    }

    public async Task Handle(DeleteBondCouponPaymentCommand request, CancellationToken cancellationToken)
    {
        var payment = await _repo.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException($"Coupon payment {request.Id} not found.");

        if (payment.UserId != _currentUser.UserId)
            throw new UnauthorizedAccessException("You do not own this coupon payment.");

        _repo.Remove(payment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
