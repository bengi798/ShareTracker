using MediatR;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Commands.UpdateSharesTrade;

public class UpdateSharesTradeCommandHandler : IRequestHandler<UpdateSharesTradeCommand, TradeDto>
{
    private readonly ITradeRepository _trades;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public UpdateSharesTradeCommandHandler(
        ITradeRepository trades,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _trades = trades;
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<TradeDto> Handle(UpdateSharesTradeCommand request, CancellationToken cancellationToken)
    {
        var trade = await _trades.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Trade with ID '{request.Id}' was not found.");

        if (trade.UserId != _currentUser.UserId)
            throw new UnauthorizedException("You are not authorised to update this trade.");

        if (trade is not SharesTrade sharesTrade)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["Id"] = ["The specified trade is not a shares trade."]
            });

        var exchange = Enum.Parse<Exchange>(request.Exchange, ignoreCase: true);
        var currency = Enum.Parse<Currency>(request.Currency, ignoreCase: true);

        sharesTrade.Update(
            pricePerUnit:   request.PricePerUnit,
            numberOfUnits:  request.NumberOfUnits,
            dateOfTrade:    request.DateOfTrade,
            ticker:         request.Ticker,
            exchange:       exchange,
            currency:       currency,
            isForeignTrade: request.IsForeignTrade,
            exchangeRate:   request.ExchangeRate,
            brokerageFees:  request.BrokerageFees,
            totalCostHome:  request.TotalCostHome);

        sharesTrade.SetPortfolio(request.PortfolioId);
        await _uow.SaveChangesAsync(cancellationToken);

        return TradeDto.FromDomain(sharesTrade);
    }
}
