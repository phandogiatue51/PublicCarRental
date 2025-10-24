using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PublicCarRental.Migrations
{
    /// <inheritdoc />
    public partial class FixDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccountDocuments_Staffs_StaffId",
                table: "AccountDocuments");

            migrationBuilder.AddForeignKey(
                name: "FK_AccountDocuments_Staffs_StaffId",
                table: "AccountDocuments",
                column: "StaffId",
                principalTable: "Staffs",
                principalColumn: "StaffId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccountDocuments_Staffs_StaffId",
                table: "AccountDocuments");

            migrationBuilder.AddForeignKey(
                name: "FK_AccountDocuments_Staffs_StaffId",
                table: "AccountDocuments",
                column: "StaffId",
                principalTable: "Staffs",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
