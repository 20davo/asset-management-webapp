using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AssetManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEquipmentCheckoutRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Checkouts_EquipmentId",
                table: "Checkouts",
                column: "EquipmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Checkouts_Equipments_EquipmentId",
                table: "Checkouts",
                column: "EquipmentId",
                principalTable: "Equipments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Checkouts_Equipments_EquipmentId",
                table: "Checkouts");

            migrationBuilder.DropIndex(
                name: "IX_Checkouts_EquipmentId",
                table: "Checkouts");
        }
    }
}
