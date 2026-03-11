using ShareTracker.Domain.Entities;

namespace ShareTracker.Application.Trades.DTOs;

public record GoldTradeDto(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    decimal? NumberOfUnitsSold,
    decimal TotalValue,
    string TradeType,
    DateOnly DateOfTrade,
    DateTime CreatedAt,
    int PurityCarats,
    string WeightUnit,
    string Currency,
    bool IsForeignTrade,
    bool ExchangeRateApplied,
    decimal? ExchangeRate,
    decimal? TotalCostHome,
    Guid? PortfolioId)
    : TradeDto(Id, PricePerUnit, NumberOfUnits, NumberOfUnitsSold, TotalValue, TradeType, DateOfTrade, CreatedAt, Currency, IsForeignTrade, ExchangeRateApplied, ExchangeRate, TotalCostHome, PortfolioId)
{
    public static GoldTradeDto FromDomain(GoldTrade trade) => new(
        trade.Id,
        trade.PricePerUnit,
        trade.NumberOfUnits,
        trade.NumberOfUnitsSold,
        trade.TotalValue,
        trade.TradeType.ToString(),
        trade.DateOfTrade,
        trade.CreatedAt,
        trade.PurityCarats,
        trade.WeightUnit.ToString(),
        trade.Currency.ToString(),
        trade.IsForeignTrade,
        trade.ExchangeRateApplied,
        trade.ExchangeRate,
        trade.TotalCostHome,
        trade.PortfolioId
    );
}
