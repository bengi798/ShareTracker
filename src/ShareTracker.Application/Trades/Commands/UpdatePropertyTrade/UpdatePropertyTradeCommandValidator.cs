using FluentValidation;
using ShareTracker.Domain.Enums;

namespace ShareTracker.Application.Trades.Commands.UpdatePropertyTrade;

public class UpdatePropertyTradeCommandValidator : AbstractValidator<UpdatePropertyTradeCommand>
{
    public UpdatePropertyTradeCommandValidator()
    {
        RuleFor(x => x.PricePerUnit)
            .GreaterThan(0).WithMessage("Price per unit must be greater than zero.");

        RuleFor(x => x.NumberOfUnits)
            .GreaterThan(0).WithMessage("Number of units must be greater than zero.");

        RuleFor(x => x.DateOfTrade)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Trade date cannot be in the future.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address must not be empty.");

        RuleFor(x => x.PropertyType)
            .NotEmpty()
            .Must(v => Enum.TryParse<PropertyType>(v, true, out _))
            .WithMessage($"PropertyType must be one of: {string.Join(", ", Enum.GetNames<PropertyType>())}.");

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
