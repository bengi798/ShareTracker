namespace ShareTracker.Application.Reports;

public record ReportRow(
    DateOnly Date,
    string TradeType,
    string Description,
    decimal Units,
    decimal PricePerUnit,
    decimal TotalValue,
    decimal? CostBasis,
    decimal? GrossGainLoss,
    decimal? TaxableGain,
    bool CgtDiscountApplied,
    bool IsSplit,
    decimal? SplitDiscountedTaxable,
    decimal? SplitNonDiscountedTaxable);

public record DividendRow(
    string Ticker,
    string Exchange,
    DateOnly ExDate,
    DateOnly? PaymentDate,
    string Period,
    decimal ValuePerUnit,
    string Currency,
    decimal UnitsHeld,
    decimal TotalDividend,
    decimal FrankingPercent,
    decimal FrankingCredit);

public record ReportData(
    int FinancialYear,
    decimal TotalProceeds,
    decimal TotalCostBasis,
    decimal NetGainLoss,
    decimal NetTaxableGain,
    bool AnyDiscountApplied,
    int ExcludedNonAudCount,
    IReadOnlyList<ReportRow> Rows,
    IReadOnlyList<DividendRow> DividendRows);
