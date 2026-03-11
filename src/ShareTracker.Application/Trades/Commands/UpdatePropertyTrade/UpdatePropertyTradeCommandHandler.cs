using MediatR;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Commands.UpdatePropertyTrade;

public class UpdatePropertyTradeCommandHandler : IRequestHandler<UpdatePropertyTradeCommand, TradeDto>
{
    private readonly ITradeRepository _trades;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public UpdatePropertyTradeCommandHandler(
        ITradeRepository trades,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _trades = trades;
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<TradeDto> Handle(UpdatePropertyTradeCommand request, CancellationToken cancellationToken)
    {
        var trade = await _trades.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Trade with ID '{request.Id}' was not found.");

        if (trade.UserId != _currentUser.UserId)
            throw new UnauthorizedException("You are not authorised to update this trade.");

        if (trade is not PropertyTrade propertyTrade)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["Id"] = ["The specified trade is not a property trade."]
            });

        var propertyType = Enum.Parse<PropertyType>(request.PropertyType, ignoreCase: true);
        var currency     = Enum.Parse<Currency>(request.Currency, ignoreCase: true);

        propertyTrade.Update(
            pricePerUnit:   request.PricePerUnit,
            numberOfUnits:  request.NumberOfUnits,
            dateOfTrade:    request.DateOfTrade,
            address:        request.Address,
            propertyType:   propertyType,
            currency:       currency,
            isForeignTrade: request.IsForeignTrade,
            exchangeRate:   request.ExchangeRate,
            totalCostHome:  request.TotalCostHome);

        propertyTrade.SetPortfolio(request.PortfolioId);
        await _uow.SaveChangesAsync(cancellationToken);

        return TradeDto.FromDomain(propertyTrade);
    }
}
