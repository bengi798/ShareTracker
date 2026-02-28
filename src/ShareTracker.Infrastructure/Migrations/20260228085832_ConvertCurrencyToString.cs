using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShareTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ConvertCurrencyToString : Migration
    {
        // Currency enum: AUD=1, USD=2, EUR=3, GBP=4, JPY=5, Other=99
        // 0 was the uninitialised default — treat as AUD.
        private const string CurrencyUsingExpr =
            "CASE \"Currency\" " +
            "WHEN 1 THEN 'AUD' WHEN 2 THEN 'USD' WHEN 3 THEN 'EUR' " +
            "WHEN 4 THEN 'GBP' WHEN 5 THEN 'JPY' WHEN 99 THEN 'Other' " +
            "ELSE 'AUD' END";

        private const string HomeCurrencyUsingExpr =
            "CASE \"HomeCurrency\" " +
            "WHEN 1 THEN 'AUD' WHEN 2 THEN 'USD' WHEN 3 THEN 'EUR' " +
            "WHEN 4 THEN 'GBP' WHEN 5 THEN 'JPY' WHEN 99 THEN 'Other' " +
            "ELSE 'AUD' END";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                $"ALTER TABLE \"Trades\" ALTER COLUMN \"Currency\" TYPE character varying(10) USING ({CurrencyUsingExpr});");

            migrationBuilder.Sql(
                $"ALTER TABLE \"AspNetUsers\" ALTER COLUMN \"HomeCurrency\" TYPE character varying(10) USING ({HomeCurrencyUsingExpr});");
        }

        private const string CurrencyDownUsingExpr =
            "CASE \"Currency\" " +
            "WHEN 'AUD' THEN 1 WHEN 'USD' THEN 2 WHEN 'EUR' THEN 3 " +
            "WHEN 'GBP' THEN 4 WHEN 'JPY' THEN 5 WHEN 'Other' THEN 99 " +
            "ELSE 1 END";

        private const string HomeCurrencyDownUsingExpr =
            "CASE \"HomeCurrency\" " +
            "WHEN 'AUD' THEN 1 WHEN 'USD' THEN 2 WHEN 'EUR' THEN 3 " +
            "WHEN 'GBP' THEN 4 WHEN 'JPY' THEN 5 WHEN 'Other' THEN 99 " +
            "ELSE 1 END";

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                $"ALTER TABLE \"Trades\" ALTER COLUMN \"Currency\" TYPE integer USING ({CurrencyDownUsingExpr});");

            migrationBuilder.Sql(
                $"ALTER TABLE \"AspNetUsers\" ALTER COLUMN \"HomeCurrency\" TYPE integer USING ({HomeCurrencyDownUsingExpr});");
        }
    }
}
