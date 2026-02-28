using MediatR;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Application.Profile.DTOs;

namespace ShareTracker.Application.Profile.Queries.GetUserProfile;

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, UserProfileDto?>
{
    private readonly IUserProfileRepository _profiles;
    private readonly ICurrentUserService    _currentUser;

    public GetUserProfileQueryHandler(IUserProfileRepository profiles, ICurrentUserService currentUser)
    {
        _profiles    = profiles;
        _currentUser = currentUser;
    }

    public async Task<UserProfileDto?> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
    {
        var profile = await _profiles.GetByClerkUserIdAsync(_currentUser.UserId, cancellationToken);
        if (profile is null) return null;
        return new UserProfileDto(profile.ClerkUserId, profile.IsForeignResident, profile.HomeCurrency);
    }
}
