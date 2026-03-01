using FluentValidation;
using ShareTracker.Domain.Enums;

namespace ShareTracker.Application.Trades.Commands.UpdateBondTrade;

public class UpdateBondTradeCommandValidator : AbstractValidator<UpdateBondTradeCommand>
{
    public UpdateBondTradeCommandValidator()
    {
        RuleFor(x => x.PricePerUnit)
            .GreaterThan(0).WithMessage("Price per unit must be greater than zero.");

        RuleFor(x => x.NumberOfUnits)
            .GreaterThan(0).WithMessage("Number of units must be greater than zero.");

        RuleFor(x => x.DateOfTrade)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Trade date cannot be in the future.");

        RuleFor(x => x.BondCode)
            .NotEmpty().WithMessage("Bond code must not be empty.");

        RuleFor(x => x.YieldPercent)
            .GreaterThan(0).WithMessage("Yield percent must be greater than zero.");

        RuleFor(x => x.MaturityDate)
            .GreaterThan(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Maturity date must be in the future.");

        RuleFor(x => x.Issuer)
            .NotEmpty().WithMessage("Issuer must not be empty.");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .Must(v => Enum.TryParse<Currency>(v, true, out _))
            .WithMessage("Currency must be a valid ISO currency code.");

        When(x => x.IsForeignTrade, () =>
        {
            RuleFor(x => x.ExchangeRate)
                .NotNull().WithMessage("Exchange rate must be provided for foreign trades.")
                .GreaterThan(0).WithMessage("Exchange rate must be greater than zero.");
        });
    }
}
