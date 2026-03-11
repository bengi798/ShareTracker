using MediatR;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Commands.UpdateGoldTrade;

public class UpdateGoldTradeCommandHandler : IRequestHandler<UpdateGoldTradeCommand, TradeDto>
{
    private readonly ITradeRepository _trades;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public UpdateGoldTradeCommandHandler(
        ITradeRepository trades,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _trades = trades;
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<TradeDto> Handle(UpdateGoldTradeCommand request, CancellationToken cancellationToken)
    {
        var trade = await _trades.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Trade with ID '{request.Id}' was not found.");

        if (trade.UserId != _currentUser.UserId)
            throw new UnauthorizedException("You are not authorised to update this trade.");

        if (trade is not GoldTrade goldTrade)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["Id"] = ["The specified trade is not a gold trade."]
            });

        var weightUnit = Enum.Parse<WeightUnit>(request.WeightUnit, ignoreCase: true);
        var currency   = Enum.Parse<Currency>(request.Currency, ignoreCase: true);

        goldTrade.Update(
            pricePerUnit:   request.PricePerUnit,
            numberOfUnits:  request.NumberOfUnits,
            dateOfTrade:    request.DateOfTrade,
            purityCarats:   request.PurityCarats,
            weightUnit:     weightUnit,
            currency:       currency,
            isForeignTrade: request.IsForeignTrade,
            exchangeRate:   request.ExchangeRate,
            totalCostHome:  request.TotalCostHome);

        goldTrade.SetPortfolio(request.PortfolioId);
        await _uow.SaveChangesAsync(cancellationToken);

        return TradeDto.FromDomain(goldTrade);
    }
}
