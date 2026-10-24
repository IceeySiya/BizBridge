using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizBridge.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessExploreVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVisibleOnExplore",
                table: "Businesses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVisibleOnExplore",
                table: "Businesses");
        }
    }
}
