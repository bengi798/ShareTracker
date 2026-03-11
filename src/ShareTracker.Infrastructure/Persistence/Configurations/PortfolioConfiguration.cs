using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Infrastructure.Persistence.Configurations;

public class PortfolioConfiguration : IEntityTypeConfiguration<Portfolio>
{
    public void Configure(EntityTypeBuilder<Portfolio> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(p => p.UserId)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(p => p.CreatedAt).IsRequired();

        builder.HasIndex(p => p.UserId);
    }
}
