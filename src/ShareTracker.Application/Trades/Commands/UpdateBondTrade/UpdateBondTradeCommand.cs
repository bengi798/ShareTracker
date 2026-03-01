using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.UpdateBondTrade;

public record UpdateBondTradeCommand(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    DateOnly DateOfTrade,
    string BondCode,
    decimal YieldPercent,
    DateOnly MaturityDate,
    string Issuer,
    string Currency,
    bool IsForeignTrade = false,
    decimal? ExchangeRate = null) : IRequest<TradeDto>;
