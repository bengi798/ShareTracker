using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTracker.Application.Portfolios.Commands.CreatePortfolio;
using ShareTracker.Application.Portfolios.Commands.DeletePortfolio;
using ShareTracker.Application.Portfolios.Commands.UpdatePortfolio;
using ShareTracker.Application.Portfolios.Queries.GetAllPortfolios;

namespace ShareTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("portfolios")]
public class PortfoliosController : ControllerBase
{
    private readonly IMediator _mediator;

    public PortfoliosController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _mediator.Send(new GetAllPortfoliosQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(CreatePortfolioCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdatePortfolioCommand command, CancellationToken ct) =>
        Ok(await _mediator.Send(command with { Id = id }, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromQuery] Guid? reassignToPortfolioId,
        CancellationToken ct)
    {
        await _mediator.Send(new DeletePortfolioCommand(id, reassignToPortfolioId), ct);
        return NoContent();
    }
}
