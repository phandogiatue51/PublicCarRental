using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PublicCarRental.Migrations
{
    /// <inheritdoc />
    public partial class DeleteStaffFromRefund : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Refunds_Staffs_StaffId",
                table: "Refunds");

            migrationBuilder.DropIndex(
                name: "IX_Refunds_StaffId",
                table: "Refunds");

            migrationBuilder.DropColumn(
                name: "StaffId",
                table: "Refunds");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StaffId",
                table: "Refunds",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_StaffId",
                table: "Refunds",
                column: "StaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_Refunds_Staffs_StaffId",
                table: "Refunds",
                column: "StaffId",
                principalTable: "Staffs",
                principalColumn: "StaffId");
        }
    }
}
