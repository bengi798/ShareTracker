using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTracker.Application.Trades.Commands.CreateBondTrade;
using ShareTracker.Application.Trades.Commands.CreateCryptoTrade;
using ShareTracker.Application.Trades.Commands.CreateGoldTrade;
using ShareTracker.Application.Trades.Commands.CreatePropertyTrade;
using ShareTracker.Application.Trades.Commands.CreateSharesTrade;
using ShareTracker.Application.Trades.Commands.DeleteTrade;
using ShareTracker.Application.Trades.Commands.UpdateBondTrade;
using ShareTracker.Application.Trades.Commands.UpdateCryptoTrade;
using ShareTracker.Application.Trades.Commands.UpdateGoldTrade;
using ShareTracker.Application.Trades.Commands.UpdatePropertyTrade;
using ShareTracker.Application.Trades.Commands.UpdateSharesTrade;
using ShareTracker.Application.Trades.Queries.GetAllTrades;
using ShareTracker.Application.Trades.Queries.GetSharesQuotes;
using ShareTracker.Application.Trades.Queries.GetCryptoQuotes;
using ShareTracker.Application.Trades.Queries.GetTradeById;

namespace ShareTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/trades")]
public class TradesController : ControllerBase
{
    private readonly IMediator _mediator;

    public TradesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _mediator.Send(new GetAllTradesQuery(), ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) =>
        Ok(await _mediator.Send(new GetTradeByIdQuery(id), ct));

    [HttpPost("shares")]
    public async Task<IActionResult> CreateShares(CreateSharesTradeCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("gold")]
    public async Task<IActionResult> CreateGold(CreateGoldTradeCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("crypto")]
    public async Task<IActionResult> CreateCrypto(CreateCryptoTradeCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("bonds")]
    public async Task<IActionResult> CreateBond(CreateBondTradeCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("property")]
    public async Task<IActionResult> CreateProperty(CreatePropertyTradeCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("shares/{id:guid}")]
    public async Task<IActionResult> UpdateShares(Guid id, UpdateSharesTradeCommand command, CancellationToken ct) =>
        Ok(await _mediator.Send(command with { Id = id }, ct));

    [HttpPut("gold/{id:guid}")]
    public async Task<IActionResult> UpdateGold(Guid id, UpdateGoldTradeCommand command, CancellationToken ct) =>
        Ok(await _mediator.Send(command with { Id = id }, ct));

    [HttpPut("crypto/{id:guid}")]
    public async Task<IActionResult> UpdateCrypto(Guid id, UpdateCryptoTradeCommand command, CancellationToken ct) =>
        Ok(await _mediator.Send(command with { Id = id }, ct));

    [HttpPut("bonds/{id:guid}")]
    public async Task<IActionResult> UpdateBond(Guid id, UpdateBondTradeCommand command, CancellationToken ct) =>
        Ok(await _mediator.Send(command with { Id = id }, ct));

    [HttpPut("property/{id:guid}")]
    public async Task<IActionResult> UpdateProperty(Guid id, UpdatePropertyTradeCommand command, CancellationToken ct) =>
        Ok(await _mediator.Send(command with { Id = id }, ct));

    [HttpGet("shares/quotes")]
    public async Task<IActionResult> GetSharesQuotes(CancellationToken ct) =>
        Ok(await _mediator.Send(new GetSharesQuotesQuery(), ct));

    [HttpGet("crypto/quotes")]
    public async Task<IActionResult> GetCryptoQuotes(CancellationToken ct) =>
        Ok(await _mediator.Send(new GetCryptoQuotesQuery(), ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteTradeCommand(id), ct);
        return NoContent();
    }
}
