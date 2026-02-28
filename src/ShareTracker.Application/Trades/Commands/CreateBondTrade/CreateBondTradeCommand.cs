using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.CreateBondTrade;

public record CreateBondTradeCommand(
    string TradeType,
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
