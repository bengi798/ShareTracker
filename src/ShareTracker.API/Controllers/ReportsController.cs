using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTracker.Application.Reports;

namespace ShareTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("reports")]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Generates and downloads a capital gains report for the given Australian financial year.
    /// </summary>
    /// <param name="fy">The financial year (e.g. 2025 = 1 July 2024 – 30 June 2025).</param>
    /// <param name="format">Output format: "pdf" or "csv".</param>
    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] int fy,
        [FromQuery] string format,
        CancellationToken ct)
    {
        var (bytes, contentType, fileName) =
            await _mediator.Send(new GenerateReportQuery(fy, format), ct);

        return File(bytes, contentType, fileName);
    }
}
