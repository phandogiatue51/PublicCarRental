using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PublicCarRental.Migrations
{
    /// <inheritdoc />
    public partial class AddAccidentAction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActionTaken",
                table: "AccidentReports",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResolutionNote",
                table: "AccidentReports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResolvedAt",
                table: "AccidentReports",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActionTaken",
                table: "AccidentReports");

            migrationBuilder.DropColumn(
                name: "ResolutionNote",
                table: "AccidentReports");

            migrationBuilder.DropColumn(
                name: "ResolvedAt",
                table: "AccidentReports");
        }
    }
}
