using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBondCouponPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BondCouponPayments",
                columns: table => new
                {
                    Id          = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId      = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    BondTradeId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Amount      = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    Currency    = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Notes       = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt   = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BondCouponPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BondCouponPayments_Trades_BondTradeId",
                        column: x => x.BondTradeId,
                        principalTable: "Trades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BondCouponPayments_BondTradeId",
                table: "BondCouponPayments",
                column: "BondTradeId");

            migrationBuilder.CreateIndex(
                name: "IX_BondCouponPayments_UserId",
                table: "BondCouponPayments",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "BondCouponPayments");
        }
    }
}
