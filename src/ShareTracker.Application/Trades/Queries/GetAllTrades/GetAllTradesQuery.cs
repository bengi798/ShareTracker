using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Queries.GetAllTrades;

public record GetAllTradesQuery() : IRequest<IReadOnlyList<TradeDto>>;
