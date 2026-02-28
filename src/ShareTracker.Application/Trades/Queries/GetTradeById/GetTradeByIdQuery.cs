using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Queries.GetTradeById;

public record GetTradeByIdQuery(Guid TradeId) : IRequest<TradeDto>;
