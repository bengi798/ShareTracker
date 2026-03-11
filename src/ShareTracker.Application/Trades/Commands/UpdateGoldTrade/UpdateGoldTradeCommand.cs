using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.UpdateGoldTrade;

public record UpdateGoldTradeCommand(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    DateOnly DateOfTrade,
    int PurityCarats,
    string WeightUnit,
    string Currency,
    bool IsForeignTrade = false,
    decimal? ExchangeRate = null,
    decimal? TotalCostHome = null,
    Guid? PortfolioId = null) : IRequest<TradeDto>;
