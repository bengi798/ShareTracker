using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Infrastructure.Persistence.Configurations;

public class GoldTradeConfiguration : IEntityTypeConfiguration<GoldTrade>
{
    public void Configure(EntityTypeBuilder<GoldTrade> builder)
    {
        builder.Property(t => t.PurityCarats).IsRequired();

        builder.Property(t => t.WeightUnit)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();
    }
}
