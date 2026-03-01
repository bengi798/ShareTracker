using MediatR;

namespace ShareTracker.Application.Reports;

public record GenerateReportQuery(int FinancialYear, string Format)
    : IRequest<(byte[] Bytes, string ContentType, string FileName)>;
