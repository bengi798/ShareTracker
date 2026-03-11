using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShareTracker.Domain.Entities;

namespace ShareTracker.Infrastructure.Persistence.Configurations;

public class BondCouponPaymentConfiguration : IEntityTypeConfiguration<BondCouponPayment>
{
    public void Configure(EntityTypeBuilder<BondCouponPayment> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.UserId)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(c => c.Amount)
            .HasColumnType("numeric(18,4)")
            .IsRequired();

        builder.Property(c => c.Currency)
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(c => c.Notes)
            .HasMaxLength(500);

        builder.Property(c => c.PaymentDate).IsRequired();
        builder.Property(c => c.CreatedAt).IsRequired();

        builder.HasOne(c => c.BondTrade)
            .WithMany()
            .HasForeignKey(c => c.BondTradeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.UserId);
        builder.HasIndex(c => c.BondTradeId);
    }
}
