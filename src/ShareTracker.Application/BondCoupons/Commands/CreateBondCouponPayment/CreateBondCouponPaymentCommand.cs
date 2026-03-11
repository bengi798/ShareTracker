using MediatR;
using ShareTracker.Application.BondCoupons.DTOs;

namespace ShareTracker.Application.BondCoupons.Commands.CreateBondCouponPayment;

public record CreateBondCouponPaymentCommand(
    Guid     BondTradeId,
    DateOnly PaymentDate,
    decimal  Amount,
    string   Currency,
    string?  Notes) : IRequest<BondCouponPaymentDto>;
