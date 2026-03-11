using MediatR;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Commands.UpdateCryptoTrade;

public class UpdateCryptoTradeCommandHandler : IRequestHandler<UpdateCryptoTradeCommand, TradeDto>
{
    private readonly ITradeRepository _trades;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public UpdateCryptoTradeCommandHandler(
        ITradeRepository trades,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _trades = trades;
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<TradeDto> Handle(UpdateCryptoTradeCommand request, CancellationToken cancellationToken)
    {
        var trade = await _trades.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Trade with ID '{request.Id}' was not found.");

        if (trade.UserId != _currentUser.UserId)
            throw new UnauthorizedException("You are not authorised to update this trade.");

        if (trade is not CryptoTrade cryptoTrade)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["Id"] = ["The specified trade is not a crypto trade."]
            });

        var currency = Enum.Parse<Currency>(request.Currency, ignoreCase: true);

        cryptoTrade.Update(
            pricePerUnit:   request.PricePerUnit,
            numberOfUnits:  request.NumberOfUnits,
            dateOfTrade:    request.DateOfTrade,
            coinSymbol:     request.CoinSymbol,
            network:        request.Network,
            currency:       currency,
            isForeignTrade: request.IsForeignTrade,
            exchangeRate:   request.ExchangeRate,
            brokerageFees:  request.BrokerageFees,
            totalCostHome:  request.TotalCostHome);

        cryptoTrade.SetPortfolio(request.PortfolioId);
        await _uow.SaveChangesAsync(cancellationToken);

        return TradeDto.FromDomain(cryptoTrade);
    }
}
