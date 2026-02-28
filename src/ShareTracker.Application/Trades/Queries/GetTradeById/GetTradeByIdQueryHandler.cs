using MediatR;
using ShareTracker.Application.Common.Exceptions;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Queries.GetTradeById;

public class GetTradeByIdQueryHandler : IRequestHandler<GetTradeByIdQuery, TradeDto>
{
    private readonly ITradeRepository _trades;
    private readonly ICurrentUserService _currentUser;

    public GetTradeByIdQueryHandler(ITradeRepository trades, ICurrentUserService currentUser)
    {
        _trades = trades;
        _currentUser = currentUser;
    }

    public async Task<TradeDto> Handle(GetTradeByIdQuery request, CancellationToken cancellationToken)
    {
        var trade = await _trades.GetByIdAsync(request.TradeId, cancellationToken)
            ?? throw new NotFoundException($"Trade with ID '{request.TradeId}' was not found.");

        if (trade.UserId != _currentUser.UserId)
            throw new UnauthorizedException("You are not authorised to view this trade.");

        return TradeDto.FromDomain(trade);
    }
}
