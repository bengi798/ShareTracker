using FluentValidation;
using ShareTracker.Domain.Enums;

namespace ShareTracker.Application.Trades.Commands.UpdateCryptoTrade;

public class UpdateCryptoTradeCommandValidator : AbstractValidator<UpdateCryptoTradeCommand>
{
    public UpdateCryptoTradeCommandValidator()
    {
        RuleFor(x => x.PricePerUnit)
            .GreaterThan(0).WithMessage("Price per unit must be greater than zero.");

        RuleFor(x => x.NumberOfUnits)
            .GreaterThan(0).WithMessage("Number of units must be greater than zero.");

        RuleFor(x => x.DateOfTrade)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Trade date cannot be in the future.");

        RuleFor(x => x.CoinSymbol)
            .NotEmpty().WithMessage("Coin symbol must not be empty.");

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

        When(x => x.BrokerageFees.HasValue, () =>
        {
            RuleFor(x => x.BrokerageFees)
                .GreaterThanOrEqualTo(0).WithMessage("Brokerage fees cannot be negative.");
        });
    }
}
