using System.Text.Json.Serialization;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Application.Trades.DTOs;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "assetType")]
[JsonDerivedType(typeof(SharesTradeDto), "Shares")]
[JsonDerivedType(typeof(GoldTradeDto), "Gold")]
[JsonDerivedType(typeof(CryptoTradeDto), "Crypto")]
[JsonDerivedType(typeof(BondTradeDto), "Bond")]
[JsonDerivedType(typeof(PropertyTradeDto), "Property")]
public abstract record TradeDto(
    Guid Id,
    decimal PricePerUnit,
    decimal NumberOfUnits,
    decimal? NumberOfUnitsSold,
    decimal TotalValue,
    string TradeType,
    DateOnly DateOfTrade,
    DateTime CreatedAt,
    string Currency,
    bool IsForeignTrade,
    bool ExchangeRateApplied,
    decimal? ExchangeRate,
    decimal? TotalCostHome,
    Guid? PortfolioId)
{
    public static TradeDto FromDomain(Trade trade) => trade switch
    {
        SharesTrade st   => SharesTradeDto.FromDomain(st),
        GoldTrade gt     => GoldTradeDto.FromDomain(gt),
        CryptoTrade ct   => CryptoTradeDto.FromDomain(ct),
        BondTrade bt     => BondTradeDto.FromDomain(bt),
        PropertyTrade pt => PropertyTradeDto.FromDomain(pt),
        _ => throw new InvalidOperationException($"Unknown trade type: {trade.GetType().Name}")
    };
}
