using MediatR;

namespace ShareTracker.Application.Trades.Commands.DeleteTrade;

public record DeleteTradeCommand(Guid TradeId) : IRequest;
