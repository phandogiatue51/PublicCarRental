using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PublicCarRental.Migrations
{
    /// <inheritdoc />
    public partial class FixNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ReportingUserId",
                table: "AccidentReports",
                newName: "StaffId");

            migrationBuilder.RenameIndex(
                name: "IX_AccidentReports_ReportingUserId",
                table: "AccidentReports",
                newName: "IX_AccidentReports_StaffId");

            migrationBuilder.AlterColumn<string>(
                name: "Location",
                table: "AccidentReports",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "AccidentReports",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "AccidentReports",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StaffId",
                table: "AccidentReports",
                newName: "ReportingUserId");

            migrationBuilder.RenameIndex(
                name: "IX_AccidentReports_StaffId",
                table: "AccidentReports",
                newName: "IX_AccidentReports_ReportingUserId");

            migrationBuilder.AlterColumn<string>(
                name: "Location",
                table: "AccidentReports",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "AccidentReports",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "AccidentReports",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
