using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Infrastructure.Persistence.Configurations;

public class TradeConfiguration : IEntityTypeConfiguration<Trade>
{
    public void Configure(EntityTypeBuilder<Trade> builder)
    {
        builder.HasKey(t => t.Id);

        builder.HasDiscriminator<string>("AssetType")
            .HasValue<SharesTrade>("Shares")
            .HasValue<GoldTrade>("Gold")
            .HasValue<CryptoTrade>("Crypto")
            .HasValue<BondTrade>("Bond")
            .HasValue<PropertyTrade>("Property");

        builder.Property(t => t.PricePerUnit)
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.Property(t => t.NumberOfUnits)
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.Property(t => t.NumberOfUnitsSold)
            .HasColumnType("numeric(18,4)")
            .IsRequired(false);

        builder.Property(t => t.TradeType)
            .HasConversion<string>()
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(t => t.Currency)
            .HasConversion<string>()
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(t => t.DateOfTrade).IsRequired();
        builder.Property(t => t.CreatedAt).IsRequired();

        builder.Property(t => t.IsForeignTrade).IsRequired();
        builder.Property(t => t.ExchangeRateApplied).IsRequired();
        builder.Property(t => t.ExchangeRate)
            .HasColumnType("numeric(18,6)")
            .IsRequired(false);

        // TotalValue is a computed property — not stored in DB
        builder.Ignore(t => t.TotalValue);

        builder.Property(t => t.UserId)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasIndex(t => t.UserId);
    }
}
