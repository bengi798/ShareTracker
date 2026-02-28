using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Infrastructure.Persistence.Configurations;

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.HasKey(u => u.ClerkUserId);

        builder.Property(u => u.ClerkUserId)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(u => u.HomeCurrency)
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(u => u.IsForeignResident)
            .IsRequired();
    }
}
