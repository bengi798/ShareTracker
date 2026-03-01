using MediatR;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Commands.UpdateBondTrade;

public class UpdateBondTradeCommandHandler : IRequestHandler<UpdateBondTradeCommand, TradeDto>
{
    private readonly ITradeRepository _trades;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public UpdateBondTradeCommandHandler(
        ITradeRepository trades,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _trades = trades;
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<TradeDto> Handle(UpdateBondTradeCommand request, CancellationToken cancellationToken)
    {
        var trade = await _trades.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Trade with ID '{request.Id}' was not found.");

        if (trade.UserId != _currentUser.UserId)
            throw new UnauthorizedException("You are not authorised to update this trade.");

        if (trade is not BondTrade bondTrade)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["Id"] = ["The specified trade is not a bond trade."]
            });

        var currency = Enum.Parse<Currency>(request.Currency, ignoreCase: true);

        bondTrade.Update(
            pricePerUnit:   request.PricePerUnit,
            numberOfUnits:  request.NumberOfUnits,
            dateOfTrade:    request.DateOfTrade,
            bondCode:       request.BondCode,
            yieldPercent:   request.YieldPercent,
            maturityDate:   request.MaturityDate,
            issuer:         request.Issuer,
            currency:       currency,
            isForeignTrade: request.IsForeignTrade,
            exchangeRate:   request.ExchangeRate);

        await _uow.SaveChangesAsync(cancellationToken);

        return TradeDto.FromDomain(bondTrade);
    }
}
