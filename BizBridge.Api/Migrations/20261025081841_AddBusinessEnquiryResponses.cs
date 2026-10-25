using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizBridge.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessEnquiryResponses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessResponse",
                table: "BusinessEnquiries",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ResponseAt",
                table: "BusinessEnquiries",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusinessResponse",
                table: "BusinessEnquiries");

            migrationBuilder.DropColumn(
                name: "ResponseAt",
                table: "BusinessEnquiries");
        }
    }
}
