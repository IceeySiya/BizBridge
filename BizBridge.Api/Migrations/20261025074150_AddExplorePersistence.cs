using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BizBridge.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddExplorePersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BusinessFollows",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "integer", nullable: false),
                    BusinessID = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessFollows", x => new { x.UserID, x.BusinessID });
                    table.ForeignKey(
                        name: "FK_BusinessFollows_Businesses_BusinessID",
                        column: x => x.BusinessID,
                        principalTable: "Businesses",
                        principalColumn: "BusinessID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BusinessFollows_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExplorePosts",
                columns: table => new
                {
                    ExplorePostID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusinessID = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExplorePosts", x => x.ExplorePostID);
                    table.ForeignKey(
                        name: "FK_ExplorePosts_Businesses_BusinessID",
                        column: x => x.BusinessID,
                        principalTable: "Businesses",
                        principalColumn: "BusinessID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExploreProducts",
                columns: table => new
                {
                    ExploreProductID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusinessID = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExploreProducts", x => x.ExploreProductID);
                    table.CheckConstraint("CK_ExploreProducts_Price", "\"Price\" > 0");
                    table.ForeignKey(
                        name: "FK_ExploreProducts_Businesses_BusinessID",
                        column: x => x.BusinessID,
                        principalTable: "Businesses",
                        principalColumn: "BusinessID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExploreSavedBusinesses",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "integer", nullable: false),
                    BusinessID = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExploreSavedBusinesses", x => new { x.UserID, x.BusinessID });
                    table.ForeignKey(
                        name: "FK_ExploreSavedBusinesses_Businesses_BusinessID",
                        column: x => x.BusinessID,
                        principalTable: "Businesses",
                        principalColumn: "BusinessID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExploreSavedBusinesses_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExplorePostLikes",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "integer", nullable: false),
                    ExplorePostID = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExplorePostLikes", x => new { x.UserID, x.ExplorePostID });
                    table.ForeignKey(
                        name: "FK_ExplorePostLikes_ExplorePosts_ExplorePostID",
                        column: x => x.ExplorePostID,
                        principalTable: "ExplorePosts",
                        principalColumn: "ExplorePostID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExplorePostLikes_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExploreSavedPosts",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "integer", nullable: false),
                    ExplorePostID = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExploreSavedPosts", x => new { x.UserID, x.ExplorePostID });
                    table.ForeignKey(
                        name: "FK_ExploreSavedPosts_ExplorePosts_ExplorePostID",
                        column: x => x.ExplorePostID,
                        principalTable: "ExplorePosts",
                        principalColumn: "ExplorePostID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExploreSavedPosts_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusinessEnquiries",
                columns: table => new
                {
                    BusinessEnquiryID = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusinessID = table.Column<int>(type: "integer", nullable: false),
                    ExploreProductID = table.Column<int>(type: "integer", nullable: true),
                    CustomerUserID = table.Column<int>(type: "integer", nullable: false),
                    Message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "New"),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessEnquiries", x => x.BusinessEnquiryID);
                    table.CheckConstraint("CK_BusinessEnquiries_Status", "\"Status\" IN ('New', 'InProgress', 'Closed')");
                    table.ForeignKey(
                        name: "FK_BusinessEnquiries_Businesses_BusinessID",
                        column: x => x.BusinessID,
                        principalTable: "Businesses",
                        principalColumn: "BusinessID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BusinessEnquiries_ExploreProducts_ExploreProductID",
                        column: x => x.ExploreProductID,
                        principalTable: "ExploreProducts",
                        principalColumn: "ExploreProductID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BusinessEnquiries_Users_CustomerUserID",
                        column: x => x.CustomerUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExploreSavedProducts",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "integer", nullable: false),
                    ExploreProductID = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExploreSavedProducts", x => new { x.UserID, x.ExploreProductID });
                    table.ForeignKey(
                        name: "FK_ExploreSavedProducts_ExploreProducts_ExploreProductID",
                        column: x => x.ExploreProductID,
                        principalTable: "ExploreProducts",
                        principalColumn: "ExploreProductID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExploreSavedProducts_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessEnquiries_BusinessID_CreatedAt",
                table: "BusinessEnquiries",
                columns: new[] { "BusinessID", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessEnquiries_CustomerUserID_CreatedAt",
                table: "BusinessEnquiries",
                columns: new[] { "CustomerUserID", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessEnquiries_ExploreProductID",
                table: "BusinessEnquiries",
                column: "ExploreProductID");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessFollows_BusinessID",
                table: "BusinessFollows",
                column: "BusinessID");

            migrationBuilder.CreateIndex(
                name: "IX_ExplorePostLikes_ExplorePostID",
                table: "ExplorePostLikes",
                column: "ExplorePostID");

            migrationBuilder.CreateIndex(
                name: "IX_ExplorePosts_BusinessID_CreatedAt",
                table: "ExplorePosts",
                columns: new[] { "BusinessID", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ExplorePosts_CreatedAt",
                table: "ExplorePosts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ExploreProducts_BusinessID_IsAvailable",
                table: "ExploreProducts",
                columns: new[] { "BusinessID", "IsAvailable" });

            migrationBuilder.CreateIndex(
                name: "IX_ExploreSavedBusinesses_BusinessID",
                table: "ExploreSavedBusinesses",
                column: "BusinessID");

            migrationBuilder.CreateIndex(
                name: "IX_ExploreSavedPosts_ExplorePostID",
                table: "ExploreSavedPosts",
                column: "ExplorePostID");

            migrationBuilder.CreateIndex(
                name: "IX_ExploreSavedProducts_ExploreProductID",
                table: "ExploreSavedProducts",
                column: "ExploreProductID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessEnquiries");

            migrationBuilder.DropTable(
                name: "BusinessFollows");

            migrationBuilder.DropTable(
                name: "ExplorePostLikes");

            migrationBuilder.DropTable(
                name: "ExploreSavedBusinesses");

            migrationBuilder.DropTable(
                name: "ExploreSavedPosts");

            migrationBuilder.DropTable(
                name: "ExploreSavedProducts");

            migrationBuilder.DropTable(
                name: "ExplorePosts");

            migrationBuilder.DropTable(
                name: "ExploreProducts");
        }
    }
}
