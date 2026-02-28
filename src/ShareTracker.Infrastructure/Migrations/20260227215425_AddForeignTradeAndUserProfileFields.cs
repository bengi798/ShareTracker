using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddForeignTradeAndUserProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ExchangeRate",
                table: "Trades",
                type: "numeric(18,6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ExchangeRateApplied",
                table: "Trades",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsForeignTrade",
                table: "Trades",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "HomeCurrency",
                table: "AspNetUsers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsForeignResident",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExchangeRate",
                table: "Trades");

            migrationBuilder.DropColumn(
                name: "ExchangeRateApplied",
                table: "Trades");

            migrationBuilder.DropColumn(
                name: "IsForeignTrade",
                table: "Trades");

            migrationBuilder.DropColumn(
                name: "HomeCurrency",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsForeignResident",
                table: "AspNetUsers");
        }
    }
}
