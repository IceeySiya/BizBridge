using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizBridge.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessContactAndImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessEmail",
                table: "Businesses",
                type: "character varying(254)",
                maxLength: 254,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BusinessPhone",
                table: "Businesses",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Businesses",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WebsiteUrl",
                table: "Businesses",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusinessEmail",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "BusinessPhone",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "WebsiteUrl",
                table: "Businesses");
        }
    }
}
