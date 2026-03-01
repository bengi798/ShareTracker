namespace ShareTracker.Application.Reports;

public interface IReportGeneratorService
{
    byte[] GeneratePdf(ReportData data);
    byte[] GenerateCsv(ReportData data);
}
