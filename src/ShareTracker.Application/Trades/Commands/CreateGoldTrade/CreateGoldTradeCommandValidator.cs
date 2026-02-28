using FluentValidation;
using ShareTracker.Domain.Enums;

namespace ShareTracker.Application.Trades.Commands.CreateGoldTrade;

public class CreateGoldTradeCommandValidator : AbstractValidator<CreateGoldTradeCommand>
{
    private static readonly int[] ValidCarats = [9, 14, 18, 22, 24];

    public CreateGoldTradeCommandValidator()
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

        RuleFor(x => x.PurityCarats)
            .Must(c => ValidCarats.Contains(c))
            .WithMessage($"Purity carats must be one of: {string.Join(", ", ValidCarats)}.");

        RuleFor(x => x.WeightUnit)
            .NotEmpty()
            .Must(v => Enum.TryParse<WeightUnit>(v, true, out _))
            .WithMessage($"WeightUnit must be one of: {string.Join(", ", Enum.GetNames<WeightUnit>())}.");
        
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
