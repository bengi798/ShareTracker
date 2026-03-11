using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTracker.Application.BondCoupons.Commands.CreateBondCouponPayment;
using ShareTracker.Application.BondCoupons.Commands.DeleteBondCouponPayment;
using ShareTracker.Application.BondCoupons.Queries.GetBondCouponPayments;

namespace ShareTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("bond-coupons")]
public class BondCouponsController : ControllerBase
{
    private readonly IMediator _mediator;

    public BondCouponsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) =>
        Ok(await _mediator.Send(new GetBondCouponPaymentsQuery(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(CreateBondCouponPaymentCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return Created($"/bond-coupons/{result.Id}", result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteBondCouponPaymentCommand(id), ct);
        return NoContent();
    }
}
