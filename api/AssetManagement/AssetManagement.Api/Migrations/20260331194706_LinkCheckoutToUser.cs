using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssetManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class LinkCheckoutToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserName",
                table: "Checkouts");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Checkouts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_UserId",
                table: "Checkouts",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Checkouts_Users_UserId",
                table: "Checkouts",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Checkouts_Users_UserId",
                table: "Checkouts");

            migrationBuilder.DropIndex(
                name: "IX_Checkouts_UserId",
                table: "Checkouts");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Checkouts");

            migrationBuilder.AddColumn<string>(
                name: "UserName",
                table: "Checkouts",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
