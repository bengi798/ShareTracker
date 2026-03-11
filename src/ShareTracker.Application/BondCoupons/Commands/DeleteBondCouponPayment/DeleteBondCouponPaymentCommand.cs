using MediatR;

namespace ShareTracker.Application.BondCoupons.Commands.DeleteBondCouponPayment;

public record DeleteBondCouponPaymentCommand(Guid Id) : IRequest;
