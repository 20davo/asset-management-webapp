using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssetManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipmentMaintenanceByUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaintenanceByUserId",
                table: "Equipments",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Equipments_MaintenanceByUserId",
                table: "Equipments",
                column: "MaintenanceByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Equipments_Users_MaintenanceByUserId",
                table: "Equipments",
                column: "MaintenanceByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Equipments_Users_MaintenanceByUserId",
                table: "Equipments");

            migrationBuilder.DropIndex(
                name: "IX_Equipments_MaintenanceByUserId",
                table: "Equipments");

            migrationBuilder.DropColumn(
                name: "MaintenanceByUserId",
                table: "Equipments");
        }
    }
}
