using ShareTracker.Domain.Entities;

namespace ShareTracker.Application.Common.Interfaces;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByClerkUserIdAsync(string clerkUserId, CancellationToken ct = default);
    Task AddAsync(UserProfile profile, CancellationToken ct = default);
}
