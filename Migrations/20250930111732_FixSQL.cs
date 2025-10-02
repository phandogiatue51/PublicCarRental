using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PublicCarRental.Migrations
{
    /// <inheritdoc />
    public partial class FixSQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PricePerHour",
                table: "Vehicles");

            migrationBuilder.AddColumn<decimal>(
                name: "PricePerHour",
                table: "VehicleModels",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PricePerHour",
                table: "VehicleModels");

            migrationBuilder.AddColumn<decimal>(
                name: "PricePerHour",
                table: "Vehicles",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
