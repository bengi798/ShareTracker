using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.CreateSharesTrade;

public record CreateSharesTradeCommand(
    string TradeType,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    DateOnly DateOfTrade,
    string Ticker,
    string Exchange,
    string Currency,
    bool IsForeignTrade = false,
    decimal? ExchangeRate = null,
    decimal? BrokerageFees = null,
    decimal? TotalCostHome = null,
    Guid? PortfolioId = null) : IRequest<TradeDto>;
