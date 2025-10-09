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
            migrationBuilder.DropColumn(
                name: "PublicId",
                table: "AccountDocuments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicId",
                table: "AccountDocuments",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
