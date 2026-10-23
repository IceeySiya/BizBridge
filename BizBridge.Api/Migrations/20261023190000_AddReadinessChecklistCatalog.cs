using BizBridge.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizBridge.Api.Migrations;

[DbContext(typeof(BizBridgeDbContext))]
[Migration("20261023190000_AddReadinessChecklistCatalog")]
public partial class AddReadinessChecklistCatalog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.InsertData(
            table: "ReadinessChecks",
            columns: new[] { "CheckID", "Title", "Description", "IsRequired" },
            values: new object[,]
            {
                { 1, "Complete your business profile", "Add your business name and industry to BizBridge.", true },
                { 2, "Record business income or expenses", "Add at least one transaction to establish a financial record.", true },
                { 3, "Capture business registration details", "Confirm that registration details are available for your business.", true },
                { 4, "Prepare your tax records", "Keep your tax reference and relevant filings together.", true },
                { 5, "Set up a business bank account", "Keep business finances separate where possible.", true },
                { 6, "Prepare a business plan or Lean Canvas", "Summarise your customers, offer, costs and revenue model.", true }
            });

        migrationBuilder.Sql(
            "SELECT setval(pg_get_serial_sequence('\"ReadinessChecks\"', 'CheckID'), (SELECT MAX(\"CheckID\") FROM \"ReadinessChecks\"), true);");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            "DELETE FROM \"ReadinessChecks\" WHERE \"CheckID\" BETWEEN 1 AND 6 AND NOT EXISTS (SELECT 1 FROM \"BusinessReadiness\" WHERE \"BusinessReadiness\".\"CheckID\" = \"ReadinessChecks\".\"CheckID\");");
    }
}
