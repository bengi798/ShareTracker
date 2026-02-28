using MediatR;
using ShareTracker.Application.Profile.DTOs;

namespace ShareTracker.Application.Profile.Queries.GetUserProfile;

public record GetUserProfileQuery : IRequest<UserProfileDto?>;
