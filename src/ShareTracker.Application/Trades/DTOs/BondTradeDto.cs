using ShareTracker.Domain.Entities;

namespace ShareTracker.Application.Trades.DTOs;

public record BondTradeDto(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    decimal? NumberOfUnitsSold,
    decimal TotalValue,
    string TradeType,
    DateOnly DateOfTrade,
    DateTime CreatedAt,
    string BondCode,
    decimal YieldPercent,
    DateOnly MaturityDate,
    string Issuer,
    string Currency,
    bool IsForeignTrade,
    bool ExchangeRateApplied,
    decimal? ExchangeRate,
    decimal? TotalCostHome,
    Guid? PortfolioId)
    : TradeDto(Id, PricePerUnit, NumberOfUnits, NumberOfUnitsSold, TotalValue, TradeType, DateOfTrade, CreatedAt, Currency, IsForeignTrade, ExchangeRateApplied, ExchangeRate, TotalCostHome, PortfolioId)
{
    public static BondTradeDto FromDomain(BondTrade trade) => new(
        trade.Id,
        trade.PricePerUnit,
        trade.NumberOfUnits,
        trade.NumberOfUnitsSold,
        trade.TotalValue,
        trade.TradeType.ToString(),
        trade.DateOfTrade,
        trade.CreatedAt,
        trade.BondCode,
        trade.YieldPercent,
        trade.MaturityDate,
        trade.Issuer,
        trade.Currency.ToString(),
        trade.IsForeignTrade,
        trade.ExchangeRateApplied,
        trade.ExchangeRate,
        trade.TotalCostHome,
        trade.PortfolioId
    );
}
