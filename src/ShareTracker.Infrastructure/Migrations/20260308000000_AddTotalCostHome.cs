using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTotalCostHome : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TotalCostHome",
                table: "Trades",
                type: "numeric(18,4)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalCostHome",
                table: "Trades");
        }
    }
}
