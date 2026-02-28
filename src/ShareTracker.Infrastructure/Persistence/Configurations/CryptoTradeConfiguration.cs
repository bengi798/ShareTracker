using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Infrastructure.Persistence.Configurations;

public class CryptoTradeConfiguration : IEntityTypeConfiguration<CryptoTrade>
{
    public void Configure(EntityTypeBuilder<CryptoTrade> builder)
    {
        builder.Property(t => t.CoinSymbol)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(t => t.Network)
            .HasMaxLength(50)
            .IsRequired(false);

        builder.Property(t => t.BrokerageFees)
            .HasColumnType("numeric(18,2)")
            .IsRequired(false);
    }
}
