using ShareTracker.Domain.Entities;

namespace ShareTracker.Application.Trades.DTOs;

public record SharesTradeDto(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    decimal? NumberOfUnitsSold,
    decimal TotalValue,
    string TradeType,
    DateOnly DateOfTrade,
    DateTime CreatedAt,
    string Ticker,
    string Exchange,
    string Currency,
    bool IsForeignTrade,
    bool ExchangeRateApplied,
    decimal? ExchangeRate,
    decimal? BrokerageFees,
    decimal? TotalCostHome,
    Guid? PortfolioId)
    : TradeDto(Id, PricePerUnit, NumberOfUnits, NumberOfUnitsSold, TotalValue, TradeType, DateOfTrade, CreatedAt, Currency, IsForeignTrade, ExchangeRateApplied, ExchangeRate, TotalCostHome, PortfolioId)
{
    public static SharesTradeDto FromDomain(SharesTrade trade) => new(
        trade.Id,
        trade.PricePerUnit,
        trade.NumberOfUnits,
        trade.NumberOfUnitsSold,
        trade.TotalValue,
        trade.TradeType.ToString(),
        trade.DateOfTrade,
        trade.CreatedAt,
        trade.Ticker.Value,
        trade.Exchange.ToString(),
        trade.Currency.ToString(),
        trade.IsForeignTrade,
        trade.ExchangeRateApplied,
        trade.ExchangeRate,
        trade.BrokerageFees,
        trade.TotalCostHome,
        trade.PortfolioId
    );
}
