using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.CreatePropertyTrade;

public record CreatePropertyTradeCommand(
    string TradeType,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    DateOnly DateOfTrade,
    string Address,
    string PropertyType,
    string Currency,
    bool IsForeignTrade = false,
    decimal? ExchangeRate = null,
    decimal? TotalCostHome = null,
    Guid? PortfolioId = null) : IRequest<TradeDto>;
