using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizBridge.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessSpecificCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Categories_Name_TransactionType",
                table: "Categories");

            migrationBuilder.AddColumn<int>(
                name: "BusinessID",
                table: "Categories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_BusinessID_Name_TransactionType",
                table: "Categories",
                columns: new[] { "BusinessID", "Name", "TransactionType" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Categories_Businesses_BusinessID",
                table: "Categories",
                column: "BusinessID",
                principalTable: "Businesses",
                principalColumn: "BusinessID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Categories_Businesses_BusinessID",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Categories_BusinessID_Name_TransactionType",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "BusinessID",
                table: "Categories");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name_TransactionType",
                table: "Categories",
                columns: new[] { "Name", "TransactionType" },
                unique: true);
        }
    }
}
