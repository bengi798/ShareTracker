using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Infrastructure.Persistence.Configurations;

public class BondTradeConfiguration : IEntityTypeConfiguration<BondTrade>
{
    public void Configure(EntityTypeBuilder<BondTrade> builder)
    {
        builder.Property(t => t.BondCode)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(t => t.YieldPercent)
            .HasColumnType("numeric(8,4)")
            .IsRequired();

        builder.Property(t => t.MaturityDate).IsRequired();

        builder.Property(t => t.Issuer)
            .HasMaxLength(100)
            .IsRequired();
    }
}
