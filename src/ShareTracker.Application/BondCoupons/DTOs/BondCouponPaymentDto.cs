namespace ShareTracker.Application.BondCoupons.DTOs;

public record BondCouponPaymentDto(
    Guid     Id,
    Guid     BondTradeId,
    DateOnly PaymentDate,
    decimal  Amount,
    string   Currency,
    string?  Notes,
    DateTime CreatedAt);
