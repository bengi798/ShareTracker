using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ShareTracker.Application.Reports;

namespace ShareTracker.Infrastructure.Services;

public class ReportGeneratorService : IReportGeneratorService
{
    private static readonly CultureInfo AuCulture = new("en-AU");

    public byte[] GeneratePdf(ReportData data)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Text($"Capital Gains Report — FY{data.FinancialYear}")
                        .FontSize(18).Bold().FontColor(Colors.Grey.Darken3);
                    col.Item().Text(
                        $"Australian Financial Year: 1 July {data.FinancialYear - 1} – 30 June {data.FinancialYear}")
                        .FontSize(9).FontColor(Colors.Grey.Medium);
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().PaddingTop(12).Column(col =>
                {
                    col.Spacing(10);

                    // ── Summary card ──────────────────────────────────────────
                    col.Item()
                        .Border(1).BorderColor(Colors.Grey.Lighten2)
                        .Padding(10)
                        .Row(row =>
                        {
                            AddSummaryCell(row, "Total Proceeds",        Fmt(data.TotalProceeds));
                            AddSummaryCell(row, "Total Cost Basis",      Fmt(data.TotalCostBasis));
                            AddSummaryCell(row, "Gross Capital Gain/(Loss)", FmtGain(data.NetGainLoss));
                            AddSummaryCell(row,
                                data.AnyDiscountApplied
                                    ? "Taxable Gain (50% CGT discount)"
                                    : "Taxable Gain",
                                FmtGain(data.NetTaxableGain));
                        });

                    // ── AUD disclaimer ────────────────────────────────────────
                    if (data.ExcludedNonAudCount > 0)
                    {
                        var plural = data.ExcludedNonAudCount == 1 ? "" : "s";
                        col.Item()
                            .Background(Colors.Amber.Lighten4)
                            .Border(1).BorderColor(Colors.Amber.Medium)
                            .Padding(6)
                            .Text($"AUD trades only — {data.ExcludedNonAudCount} non-AUD trade{plural} excluded from this report.")
                            .FontSize(8).FontColor(Colors.Orange.Darken3);
                    }

                    // ── Trades table ──────────────────────────────────────────
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(65);   // Date
                            cols.ConstantColumn(32);   // Type
                            cols.RelativeColumn(2);    // Description
                            cols.ConstantColumn(55);   // Units
                            cols.ConstantColumn(65);   // Price/Unit
                            cols.ConstantColumn(65);   // Total Value
                            cols.ConstantColumn(65);   // Cost Basis
                            cols.ConstantColumn(72);   // Gross Gain/(Loss)
                            cols.ConstantColumn(72);   // Taxable Gain
                        });

                        table.Header(h =>
                        {
                            static void Hdr(IContainer cell, string text, bool right = false)
                            {
                                var styled = cell.Background(Colors.Grey.Darken2).Padding(5);
                                var t = right
                                    ? styled.AlignRight().Text(text)
                                    : styled.Text(text);
                                t.FontColor(Colors.White).Bold().FontSize(8);
                            }

                            Hdr(h.Cell(), "Date");
                            Hdr(h.Cell(), "Type");
                            Hdr(h.Cell(), "Description");
                            Hdr(h.Cell(), "Units",             right: true);
                            Hdr(h.Cell(), "Price/Unit",        right: true);
                            Hdr(h.Cell(), "Total Value",       right: true);
                            Hdr(h.Cell(), "Cost Basis",        right: true);
                            Hdr(h.Cell(), "Gross Gain/(Loss)", right: true);
                            Hdr(h.Cell(), "Taxable Gain",      right: true);
                        });

                        uint rowIdx = 0;
                        foreach (var row in data.Rows)
                        {
                            var bg     = rowIdx % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;
                            var isSell = row.TradeType == "Sell";
                            rowIdx++;

                            DataCell(table, row.Date.ToString("dd MMM yyyy"), bg);
                            DataCell(table, row.TradeType, bg,
                                color: isSell ? Colors.Orange.Darken2 : Colors.Indigo.Darken1,
                                bold: true);
                            DataCell(table, row.Description, bg);
                            DataCell(table, FmtUnits(row.Units), bg, right: true);
                            DataCell(table, Fmt(row.PricePerUnit), bg, right: true);
                            DataCell(table, Fmt(row.TotalValue), bg, right: true);
                            DataCell(table,
                                row.CostBasis.HasValue ? Fmt(row.CostBasis.Value) : "—",
                                bg, right: true);
                            DataCell(table,
                                row.GrossGainLoss.HasValue ? FmtGain(row.GrossGainLoss.Value) : "—",
                                bg, right: true,
                                color: row.GrossGainLoss.HasValue ? GainColor(row.GrossGainLoss.Value) : Colors.Grey.Medium);
                            DataCell(table,
                                row.TaxableGain.HasValue ? FmtGain(row.TaxableGain.Value) : "—",
                                bg, right: true,
                                color: row.TaxableGain.HasValue ? GainColor(row.TaxableGain.Value) : Colors.Grey.Medium);
                        }
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ").FontColor(Colors.Grey.Medium).FontSize(8);
                    x.CurrentPageNumber().FontColor(Colors.Grey.Medium).FontSize(8);
                    x.Span(" of ").FontColor(Colors.Grey.Medium).FontSize(8);
                    x.TotalPages().FontColor(Colors.Grey.Medium).FontSize(8);
                    x.Span("  ·  Generated by ShareTracker  ·  AUD trades only").FontColor(Colors.Grey.Medium).FontSize(8);
                });
            });
        }).GeneratePdf();
    }

    public byte[] GenerateCsv(ReportData data)
    {
        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));

        csv.WriteField("Date");
        csv.WriteField("Type");
        csv.WriteField("Description");
        csv.WriteField("Units");
        csv.WriteField("Price Per Unit (AUD)");
        csv.WriteField("Total Value (AUD)");
        csv.WriteField("Cost Basis (AUD)");
        csv.WriteField("Gross Gain/(Loss) (AUD)");
        csv.WriteField("Taxable Gain (AUD)");
        csv.WriteField("50% CGT Discount Applied");
        csv.NextRecord();

        foreach (var row in data.Rows)
        {
            csv.WriteField(row.Date.ToString("yyyy-MM-dd"));
            csv.WriteField(row.TradeType);
            csv.WriteField(row.Description);
            csv.WriteField(row.Units);
            csv.WriteField(row.PricePerUnit);
            csv.WriteField(row.TotalValue);
            csv.WriteField(row.CostBasis.HasValue ? (object)row.CostBasis.Value : "");
            csv.WriteField(row.GrossGainLoss.HasValue ? (object)row.GrossGainLoss.Value : "");
            csv.WriteField(row.TaxableGain.HasValue ? (object)row.TaxableGain.Value : "");
            csv.WriteField(row.CgtDiscountApplied ? "Yes" : "");
            csv.NextRecord();
        }

        // Summary rows
        csv.NextRecord();
        csv.WriteField("SUMMARY");
        csv.WriteField($"FY{data.FinancialYear}");
        csv.NextRecord();

        csv.WriteField("Total Proceeds");
        csv.WriteField(data.TotalProceeds);
        csv.NextRecord();

        csv.WriteField("Total Cost Basis");
        csv.WriteField(data.TotalCostBasis);
        csv.NextRecord();

        csv.WriteField("Net Gain/(Loss)");
        csv.WriteField(data.NetGainLoss);
        csv.NextRecord();

        csv.WriteField(data.AnyDiscountApplied ? "Taxable Gain (50% CGT discount applied)" : "Taxable Gain");
        csv.WriteField(data.NetTaxableGain);
        csv.NextRecord();

        writer.Flush();
        return ms.ToArray();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string Fmt(decimal v) => v.ToString("C2", AuCulture);

    private static string FmtGain(decimal v) =>
        (v >= 0 ? "+" : "") + v.ToString("C2", AuCulture);

    private static string FmtUnits(decimal v) =>
        v % 1 == 0 ? v.ToString("N0", CultureInfo.InvariantCulture) : v.ToString(CultureInfo.InvariantCulture);

    private static string GainColor(decimal v) =>
        v >= 0 ? Colors.Green.Darken2 : Colors.Red.Darken2;

    private static void AddSummaryCell(RowDescriptor row, string label, string value)
    {
        row.RelativeItem().Column(col =>
        {
            col.Item().Text(label).FontSize(8).FontColor(Colors.Grey.Medium);
            col.Item().Text(value).FontSize(13).Bold().FontColor(Colors.Grey.Darken3);
        });
    }

    private static void DataCell(
        TableDescriptor table,
        string text,
        string background,
        bool right = false,
        string? color = null,
        bool bold = false)
    {
        var cell = table.Cell().Background(background).Padding(4);
        var t = right ? cell.AlignRight().Text(text) : cell.Text(text);
        if (color != null) t.FontColor(color);
        if (bold) t.Bold();
    }
}
