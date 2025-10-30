using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PublicCarRental.Migrations
{
    /// <inheritdoc />
    public partial class AddRefund : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    AccountId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FullName = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RegisteredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    EmailVerificationToken = table.Column<string>(type: "text", nullable: true),
                    IsEmailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    IdentityCardNumber = table.Column<string>(type: "text", nullable: true),
                    PasswordResetToken = table.Column<string>(type: "text", nullable: true),
                    PasswordResetRequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.AccountId);
                });

            migrationBuilder.CreateTable(
                name: "Stations",
                columns: table => new
                {
                    StationId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stations", x => x.StationId);
                });

            migrationBuilder.CreateTable(
                name: "VehicleBrands",
                columns: table => new
                {
                    BrandId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleBrands", x => x.BrandId);
                });

            migrationBuilder.CreateTable(
                name: "VehicleTypes",
                columns: table => new
                {
                    TypeId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleTypes", x => x.TypeId);
                });

            migrationBuilder.CreateTable(
                name: "EVRenters",
                columns: table => new
                {
                    RenterId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    LicenseNumber = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EVRenters", x => x.RenterId);
                    table.ForeignKey(
                        name: "FK_EVRenters_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Staffs",
                columns: table => new
                {
                    StaffId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    StationId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Staffs", x => x.StaffId);
                    table.ForeignKey(
                        name: "FK_Staffs_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Staffs_Stations_StationId",
                        column: x => x.StationId,
                        principalTable: "Stations",
                        principalColumn: "StationId");
                });

            migrationBuilder.CreateTable(
                name: "VehicleModels",
                columns: table => new
                {
                    ModelId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    BrandId = table.Column<int>(type: "integer", nullable: false),
                    TypeId = table.Column<int>(type: "integer", nullable: false),
                    PricePerHour = table.Column<decimal>(type: "numeric", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleModels", x => x.ModelId);
                    table.ForeignKey(
                        name: "FK_VehicleModels_VehicleBrands_BrandId",
                        column: x => x.BrandId,
                        principalTable: "VehicleBrands",
                        principalColumn: "BrandId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VehicleModels_VehicleTypes_TypeId",
                        column: x => x.TypeId,
                        principalTable: "VehicleTypes",
                        principalColumn: "TypeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AccountDocuments",
                columns: table => new
                {
                    DocumentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    FileUrl = table.Column<string>(type: "text", nullable: false),
                    Side = table.Column<int>(type: "integer", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DocumentNumber = table.Column<string>(type: "text", nullable: true),
                    StaffId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountDocuments", x => x.DocumentId);
                    table.ForeignKey(
                        name: "FK_AccountDocuments_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AccountDocuments_Staffs_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staffs",
                        principalColumn: "StaffId");
                });

            migrationBuilder.CreateTable(
                name: "Favorites",
                columns: table => new
                {
                    FavoriteId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AccountId = table.Column<int>(type: "integer", nullable: false),
                    ModelId = table.Column<int>(type: "integer", nullable: false),
                    FavoritedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favorites", x => x.FavoriteId);
                    table.ForeignKey(
                        name: "FK_Favorites_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "AccountId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Favorites_VehicleModels_ModelId",
                        column: x => x.ModelId,
                        principalTable: "VehicleModels",
                        principalColumn: "ModelId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    VehicleId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LicensePlate = table.Column<string>(type: "text", nullable: false),
                    BatteryLevel = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StationId = table.Column<int>(type: "integer", nullable: true),
                    ModelId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.VehicleId);
                    table.ForeignKey(
                        name: "FK_Vehicles_Stations_StationId",
                        column: x => x.StationId,
                        principalTable: "Stations",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK_Vehicles_VehicleModels_ModelId",
                        column: x => x.ModelId,
                        principalTable: "VehicleModels",
                        principalColumn: "ModelId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RentalContracts",
                columns: table => new
                {
                    ContractId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EVRenterId = table.Column<int>(type: "integer", nullable: false),
                    StaffId = table.Column<int>(type: "integer", nullable: true),
                    VehicleId = table.Column<int>(type: "integer", nullable: true),
                    StationId = table.Column<int>(type: "integer", nullable: true),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalCost = table.Column<decimal>(type: "numeric", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ImageUrlIn = table.Column<string>(type: "text", nullable: true),
                    ImageUrlOut = table.Column<string>(type: "text", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    IsRated = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RentalContracts", x => x.ContractId);
                    table.ForeignKey(
                        name: "FK_RentalContracts_EVRenters_EVRenterId",
                        column: x => x.EVRenterId,
                        principalTable: "EVRenters",
                        principalColumn: "RenterId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RentalContracts_Staffs_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staffs",
                        principalColumn: "StaffId");
                    table.ForeignKey(
                        name: "FK_RentalContracts_Stations_StationId",
                        column: x => x.StationId,
                        principalTable: "Stations",
                        principalColumn: "StationId");
                    table.ForeignKey(
                        name: "FK_RentalContracts_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "VehicleId");
                });

            migrationBuilder.CreateTable(
                name: "AccidentReports",
                columns: table => new
                {
                    AccidentId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    VehicleId = table.Column<int>(type: "integer", nullable: false),
                    ContractId = table.Column<int>(type: "integer", nullable: true),
                    StaffId = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: true),
                    ReportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccidentReports", x => x.AccidentId);
                    table.ForeignKey(
                        name: "FK_AccidentReports_RentalContracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "RentalContracts",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_AccidentReports_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "VehicleId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    InvoiceId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContractId = table.Column<int>(type: "integer", nullable: true),
                    IssuedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AmountDue = table.Column<decimal>(type: "numeric", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "numeric", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    OrderCode = table.Column<int>(type: "integer", nullable: true),
                    BookingToken = table.Column<string>(type: "text", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    RefundAmount = table.Column<decimal>(type: "numeric", nullable: true),
                    RefundedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TransactionId = table.Column<int>(type: "integer", nullable: true),
                    RefundId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.InvoiceId);
                    table.ForeignKey(
                        name: "FK_Invoices_RentalContracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "RentalContracts",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Ratings",
                columns: table => new
                {
                    RatingId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContractId = table.Column<int>(type: "integer", nullable: false),
                    Stars = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ratings", x => x.RatingId);
                    table.ForeignKey(
                        name: "FK_Ratings_RentalContracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "RentalContracts",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Refunds",
                columns: table => new
                {
                    RefundId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InvoiceId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RequestedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StaffId = table.Column<int>(type: "integer", nullable: false),
                    PayoutTransactionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Refunds", x => x.RefundId);
                    table.ForeignKey(
                        name: "FK_Refunds_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "InvoiceId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Refunds_Staffs_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staffs",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    TransactionId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InvoiceId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.TransactionId);
                    table.ForeignKey(
                        name: "FK_Transactions_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "InvoiceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccidentReports_ContractId",
                table: "AccidentReports",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_AccidentReports_ReportedAt",
                table: "AccidentReports",
                column: "ReportedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AccidentReports_StaffId",
                table: "AccidentReports",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_AccidentReports_Status",
                table: "AccidentReports",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AccidentReports_VehicleId",
                table: "AccidentReports",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_AccountDocuments_AccountId",
                table: "AccountDocuments",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_AccountDocuments_AccountId_Type",
                table: "AccountDocuments",
                columns: new[] { "AccountId", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_AccountDocuments_StaffId",
                table: "AccountDocuments",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Email",
                table: "Accounts",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_IdentityCardNumber",
                table: "Accounts",
                column: "IdentityCardNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_PhoneNumber",
                table: "Accounts",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EVRenters_AccountId",
                table: "EVRenters",
                column: "AccountId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EVRenters_LicenseNumber",
                table: "EVRenters",
                column: "LicenseNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_AccountId",
                table: "Favorites",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_ModelId",
                table: "Favorites",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ContractId",
                table: "Invoices",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_ContractId",
                table: "Ratings",
                column: "ContractId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_InvoiceId",
                table: "Refunds",
                column: "InvoiceId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_RequestedDate",
                table: "Refunds",
                column: "RequestedDate");

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_StaffId",
                table: "Refunds",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_Refunds_Status",
                table: "Refunds",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_RentalContracts_EVRenterId",
                table: "RentalContracts",
                column: "EVRenterId");

            migrationBuilder.CreateIndex(
                name: "IX_RentalContracts_StaffId",
                table: "RentalContracts",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_RentalContracts_StationId",
                table: "RentalContracts",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_RentalContracts_VehicleId",
                table: "RentalContracts",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Staffs_AccountId",
                table: "Staffs",
                column: "AccountId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Staffs_StationId",
                table: "Staffs",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_InvoiceId",
                table: "Transactions",
                column: "InvoiceId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_Timestamp",
                table: "Transactions",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_Type",
                table: "Transactions",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModels_BrandId",
                table: "VehicleModels",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModels_TypeId",
                table: "VehicleModels",
                column: "TypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_LicensePlate",
                table: "Vehicles",
                column: "LicensePlate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_ModelId",
                table: "Vehicles",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_StationId",
                table: "Vehicles",
                column: "StationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccidentReports");

            migrationBuilder.DropTable(
                name: "AccountDocuments");

            migrationBuilder.DropTable(
                name: "Favorites");

            migrationBuilder.DropTable(
                name: "Ratings");

            migrationBuilder.DropTable(
                name: "Refunds");

            migrationBuilder.DropTable(
                name: "Transactions");

            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "RentalContracts");

            migrationBuilder.DropTable(
                name: "EVRenters");

            migrationBuilder.DropTable(
                name: "Staffs");

            migrationBuilder.DropTable(
                name: "Vehicles");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "Stations");

            migrationBuilder.DropTable(
                name: "VehicleModels");

            migrationBuilder.DropTable(
                name: "VehicleBrands");

            migrationBuilder.DropTable(
                name: "VehicleTypes");
        }
    }
}
