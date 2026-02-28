using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Profile.DTOs;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.Interfaces.Repositories;

namespace ShareTracker.Application.Profile.Commands.UpsertUserProfile;

public class UpsertUserProfileCommandHandler : IRequestHandler<UpsertUserProfileCommand, UserProfileDto>
{
    private readonly IUserProfileRepository _profiles;
    private readonly IUnitOfWork            _uow;
    private readonly ICurrentUserService    _currentUser;

    public UpsertUserProfileCommandHandler(
        IUserProfileRepository profiles,
        IUnitOfWork uow,
        ICurrentUserService currentUser)
    {
        _profiles    = profiles;
        _uow         = uow;
        _currentUser = currentUser;
    }

    public async Task<UserProfileDto> Handle(UpsertUserProfileCommand request, CancellationToken cancellationToken)
    {
        var clerkUserId = _currentUser.UserId;

        var profile = await _profiles.GetByClerkUserIdAsync(clerkUserId, cancellationToken);

        if (profile is null)
        {
            profile = new UserProfile { ClerkUserId = clerkUserId };
            await _profiles.AddAsync(profile, cancellationToken);
        }

        profile.IsForeignResident = request.IsForeignResident;
        profile.HomeCurrency      = request.HomeCurrency;

        await _uow.SaveChangesAsync(cancellationToken);

        return new UserProfileDto(profile.ClerkUserId, profile.IsForeignResident, profile.HomeCurrency);
    }
}
