using MediatR;
using ShareTracker.Application.BondCoupons.DTOs;

namespace ShareTracker.Application.BondCoupons.Queries.GetBondCouponPayments;

public record GetBondCouponPaymentsQuery : IRequest<IReadOnlyList<BondCouponPaymentDto>>;
