using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShareTracker.Domain.Entities;
using ShareTracker.Domain.ValueObjects;

namespace ShareTracker.Infrastructure.Persistence.Configurations;

public class SharesTradeConfiguration : IEntityTypeConfiguration<SharesTrade>
{
    public void Configure(EntityTypeBuilder<SharesTrade> builder)
    {
        builder.Property(t => t.Ticker)
            .HasConversion(
                vo => vo.Value,
                raw => TickerSymbol.Create(raw))
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(t => t.Exchange)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(t => t.BrokerageFees)
            .HasColumnType("numeric(18,2)")
            .IsRequired(false);
    }
}
