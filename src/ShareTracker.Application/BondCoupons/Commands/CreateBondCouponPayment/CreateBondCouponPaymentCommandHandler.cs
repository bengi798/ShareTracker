using MediatR;
using ShareTracker.Application.BondCoupons.DTOs;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.BondCoupons.Commands.CreateBondCouponPayment;

public class CreateBondCouponPaymentCommandHandler
    : IRequestHandler<CreateBondCouponPaymentCommand, BondCouponPaymentDto>
{
    private readonly IBondCouponPaymentRepository _repo;
    private readonly ITradeRepository             _trades;
    private readonly ICurrentUserService          _currentUser;
    private readonly IUnitOfWork                  _unitOfWork;

    public CreateBondCouponPaymentCommandHandler(
        IBondCouponPaymentRepository repo,
        ITradeRepository             trades,
        ICurrentUserService          currentUser,
        IUnitOfWork                  unitOfWork)
    {
        _repo        = repo;
        _trades      = trades;
        _currentUser = currentUser;
        _unitOfWork  = unitOfWork;
    }

    public async Task<BondCouponPaymentDto> Handle(
        CreateBondCouponPaymentCommand request, CancellationToken cancellationToken)
    {
        // Verify the bond trade belongs to the current user
        var trade = await _trades.GetByIdAsync(request.BondTradeId, cancellationToken)
            ?? throw new KeyNotFoundException($"Bond trade {request.BondTradeId} not found.");

        if (trade.UserId != _currentUser.UserId)
            throw new UnauthorizedAccessException("You do not own this bond trade.");

        var payment = BondCouponPayment.Create(
            _currentUser.UserId,
            request.BondTradeId,
            request.PaymentDate,
            request.Amount,
            request.Currency,
            request.Notes);

        await _repo.AddAsync(payment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(payment);
    }

    internal static BondCouponPaymentDto ToDto(BondCouponPayment p) =>
        new(p.Id, p.BondTradeId, p.PaymentDate, p.Amount, p.Currency, p.Notes, p.CreatedAt);
}
