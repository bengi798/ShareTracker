using FluentValidation;
using ShareTracker.Domain.Enums;

namespace ShareTracker.Application.Trades.Commands.CreateSharesTrade;

public class CreateSharesTradeCommandValidator : AbstractValidator<CreateSharesTradeCommand>
{
    public CreateSharesTradeCommandValidator()
    {
        RuleFor(x => x.TradeType)
            .NotEmpty()
            .Must(v => Enum.TryParse<TradeType>(v, true, out _))
            .WithMessage("TradeType must be 'Buy' or 'Sell'.");

        RuleFor(x => x.PricePerUnit)
            .GreaterThan(0).WithMessage("Price per unit must be greater than zero.");

        RuleFor(x => x.NumberOfUnits)
            .GreaterThan(0).WithMessage("Number of units must be greater than zero.");

        RuleFor(x => x.DateOfTrade)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Trade date cannot be in the future.");

        RuleFor(x => x.Ticker)
            .NotEmpty()
            .MaximumLength(10)
            .Matches(@"^[A-Za-z0-9.]+$").WithMessage("Ticker must be alphanumeric.");

        RuleFor(x => x.Exchange)
            .NotEmpty()
            .Must(v => Enum.TryParse<Exchange>(v, true, out _))
            .WithMessage($"Exchange must be one of: {string.Join(", ", Enum.GetNames<Exchange>())}.");
            
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
