using MediatR;
using ShareTracker.Application.Profile.DTOs;

namespace ShareTracker.Application.Profile.Commands.UpsertUserProfile;

public record UpsertUserProfileCommand(
    bool   IsForeignResident,
    string HomeCurrency) : IRequest<UserProfileDto>;
