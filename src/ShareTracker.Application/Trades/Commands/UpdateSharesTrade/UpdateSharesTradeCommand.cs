using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.UpdateSharesTrade;

public record UpdateSharesTradeCommand(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    DateOnly DateOfTrade,
    string Ticker,
    string Exchange,
    string Currency,
    bool IsForeignTrade = false,
    decimal? ExchangeRate = null,
    decimal? BrokerageFees = null) : IRequest<TradeDto>;
