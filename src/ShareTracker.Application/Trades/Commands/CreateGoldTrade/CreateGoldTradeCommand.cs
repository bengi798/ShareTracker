using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.CreateGoldTrade;

public record CreateGoldTradeCommand(
    string TradeType,
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
