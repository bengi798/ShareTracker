using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.CreateCryptoTrade;

public record CreateCryptoTradeCommand(
    string TradeType,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    DateOnly DateOfTrade,
    string CoinSymbol,
    string? Network = null,
    string Currency = "USD",
    bool IsForeignTrade = false,
    decimal? ExchangeRate = null,
    decimal? BrokerageFees = null,
    decimal? TotalCostHome = null,
    Guid? PortfolioId = null) : IRequest<TradeDto>;
