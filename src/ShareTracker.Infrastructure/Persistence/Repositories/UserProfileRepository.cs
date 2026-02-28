using Microsoft.EntityFrameworkCore;
using ShareTracker.Application.Common.Interfaces;
using ShareTracker.Domain.Entities;
using ShareTracker.Infrastructure.Persistence;

namespace ShareTracker.Infrastructure.Persistence.Repositories;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly ShareTrackerDbContext _context;

    public UserProfileRepository(ShareTrackerDbContext context) => _context = context;

    public async Task<UserProfile?> GetByClerkUserIdAsync(string clerkUserId, CancellationToken ct = default) =>
        await _context.UserProfiles.FirstOrDefaultAsync(p => p.ClerkUserId == clerkUserId, ct);

    public async Task AddAsync(UserProfile profile, CancellationToken ct = default) =>
        await _context.UserProfiles.AddAsync(profile, ct);
}
