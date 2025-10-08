using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PublicCarRental.Migrations
{
    /// <inheritdoc />
    public partial class AddPayOS : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentExpiryTime",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PaymentGateway",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PaymentResponseCode",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PaymentSecureHash",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PaymentTransactionId",
                table: "Invoices");

            migrationBuilder.AddColumn<int>(
                name: "OrderCode",
                table: "Invoices",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderCode",
                table: "Invoices");

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentExpiryTime",
                table: "Invoices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentGateway",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentResponseCode",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentSecureHash",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentTransactionId",
                table: "Invoices",
                type: "text",
                nullable: true);
        }
    }
}
