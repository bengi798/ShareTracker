using MediatR;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Enums;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Commands.CreateCryptoTrade;

public class CreateCryptoTradeCommandHandler : IRequestHandler<CreateCryptoTradeCommand, TradeDto>
{
    private readonly ITradeRepository _trades;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public CreateCryptoTradeCommandHandler(
        ITradeRepository trades,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _trades = trades;
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<TradeDto> Handle(CreateCryptoTradeCommand request, CancellationToken cancellationToken)
    {
        var tradeType = Enum.Parse<TradeType>(request.TradeType, ignoreCase: true);
        var currency = Enum.Parse<Currency>(request.Currency, ignoreCase: true);

        if (tradeType == TradeType.Sell)
        {
            var existing = await _trades.GetAllByUserIdAsync(_currentUser.UserId, cancellationToken);
            var matchingTrades = existing
                .OfType<CryptoTrade>()
                .Where(t => string.Equals(t.CoinSymbol, request.CoinSymbol, StringComparison.OrdinalIgnoreCase))
                .ToList();

            var netPosition = matchingTrades
                .Sum(t => t.TradeType == TradeType.Buy ? t.NumberOfUnits : -t.NumberOfUnits);

            if (request.NumberOfUnits > netPosition)
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    ["NumberOfUnits"] = [$"Insufficient position. You have {netPosition:G} available unit(s) of {request.CoinSymbol.ToUpperInvariant()}."]
                });

            var buyTrades = matchingTrades
                .Where(t => t.TradeType == TradeType.Buy)
                .OrderBy(t => t.DateOfTrade)
                .ThenBy(t => t.CreatedAt);

            FifoAllocator.Allocate(buyTrades, request.NumberOfUnits);
        }

        var trade = CryptoTrade.Create(
            userId:         _currentUser.UserId,
            pricePerUnit:   request.PricePerUnit,
            numberOfUnits:  request.NumberOfUnits,
            dateOfTrade:    request.DateOfTrade,
            tradeType:      tradeType,
            coinSymbol:     request.CoinSymbol,
            network:        request.Network,
            currency:       currency,
            isForeignTrade: request.IsForeignTrade,
            exchangeRate:   request.ExchangeRate,
            brokerageFees:  request.BrokerageFees
        );

        await _trades.AddAsync(trade, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return TradeDto.FromDomain(trade);
    }
}
