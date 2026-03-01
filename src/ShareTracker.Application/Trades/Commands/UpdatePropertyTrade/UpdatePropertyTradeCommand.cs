using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.UpdatePropertyTrade;

public record UpdatePropertyTradeCommand(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    DateOnly DateOfTrade,
    string Address,
    string PropertyType,
    string Currency,
    bool IsForeignTrade = false,
    decimal? ExchangeRate = null) : IRequest<TradeDto>;
