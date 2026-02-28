using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Trades.DTOs;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Trades.Queries.GetAllTrades;

public class GetAllTradesQueryHandler : IRequestHandler<GetAllTradesQuery, IReadOnlyList<TradeDto>>
{
    private readonly ITradeRepository _trades;
    private readonly ICurrentUserService _currentUser;

    public GetAllTradesQueryHandler(ITradeRepository trades, ICurrentUserService currentUser)
    {
        _trades = trades;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<TradeDto>> Handle(GetAllTradesQuery request, CancellationToken cancellationToken)
    {
        var trades = await _trades.GetAllByUserIdAsync(_currentUser.UserId, cancellationToken);
        return trades.Select(TradeDto.FromDomain).ToList();
    }
}
