using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Infrastructure.Persistence.Configurations;

public class PropertyTradeConfiguration : IEntityTypeConfiguration<PropertyTrade>
{
    public void Configure(EntityTypeBuilder<PropertyTrade> builder)
    {
        builder.Property(t => t.Address)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(t => t.PropertyType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();
    }
}
