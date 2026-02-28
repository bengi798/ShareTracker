using ShareTracker.Domain.Entities;

namespace ShareTracker.Application.Trades.DTOs;

public record CryptoTradeDto(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    decimal? NumberOfUnitsSold,
    decimal TotalValue,
    string TradeType,
    DateOnly DateOfTrade,
    DateTime CreatedAt,
    string CoinSymbol,
    string? Network,
    string Currency,
    bool IsForeignTrade,
    bool ExchangeRateApplied,
    decimal? ExchangeRate,
    decimal? BrokerageFees)
    : TradeDto(Id, PricePerUnit, NumberOfUnits, NumberOfUnitsSold, TotalValue, TradeType, DateOfTrade, CreatedAt, Currency, IsForeignTrade, ExchangeRateApplied, ExchangeRate)
{
    public static CryptoTradeDto FromDomain(CryptoTrade trade) => new(
        trade.Id,
        trade.PricePerUnit,
        trade.NumberOfUnits,
        trade.NumberOfUnitsSold,
        trade.TotalValue,
        trade.TradeType.ToString(),
        trade.DateOfTrade,
        trade.CreatedAt,
        trade.CoinSymbol,
        trade.Network,
        trade.Currency.ToString(),
        trade.IsForeignTrade,
        trade.ExchangeRateApplied,
        trade.ExchangeRate,
        trade.BrokerageFees
    );
}
