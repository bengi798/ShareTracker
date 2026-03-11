using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPortfolios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Portfolios",
                columns: table => new
                {
                    Id        = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId    = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Name      = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Portfolios", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Portfolios_UserId",
                table: "Portfolios",
                column: "UserId");

            migrationBuilder.AddColumn<Guid>(
                name: "PortfolioId",
                table: "Trades",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Trades_PortfolioId",
                table: "Trades",
                column: "PortfolioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Trades_Portfolios_PortfolioId",
                table: "Trades",
                column: "PortfolioId",
                principalTable: "Portfolios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trades_Portfolios_PortfolioId",
                table: "Trades");

            migrationBuilder.DropIndex(
                name: "IX_Trades_PortfolioId",
                table: "Trades");

            migrationBuilder.DropColumn(
                name: "PortfolioId",
                table: "Trades");

            migrationBuilder.DropTable(name: "Portfolios");
        }
    }
}
