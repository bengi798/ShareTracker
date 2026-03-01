using MediatR;
using ShareTracker.Application.Trades.DTOs;

namespace ShareTracker.Application.Trades.Commands.UpdateCryptoTrade;

public record UpdateCryptoTradeCommand(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    DateOnly DateOfTrade,
    string CoinSymbol,
    string? Network = null,
    string Currency = "USD",
    bool IsForeignTrade = false,
    decimal? ExchangeRate = null,
    decimal? BrokerageFees = null) : IRequest<TradeDto>;
