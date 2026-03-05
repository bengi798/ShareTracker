using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShareTracker.Application.Profile.Commands.UpsertUserProfile;
using ShareTracker.Application.Profile.Queries.GetUserProfile;

namespace ShareTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("profile")]
public class ProfileController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProfileController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var profile = await _mediator.Send(new GetUserProfileQuery(), ct);
        if (profile is null) return NotFound();
        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> Upsert(UpsertUserProfileCommand command, CancellationToken ct)
    {
        var profile = await _mediator.Send(command, ct);
        return Ok(profile);
    }
}
