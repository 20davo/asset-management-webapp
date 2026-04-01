using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssetManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueSerialNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Equipments_SerialNumber",
                table: "Equipments",
                column: "SerialNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Equipments_SerialNumber",
                table: "Equipments");
        }
    }
}
