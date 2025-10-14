using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Infrastructure.Data.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
namespace PublicCarRental.Application.Service;

public class PdfContractService
{
    public byte[] GenerateRentalContract(RentalContract contract)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(12));

                page.Header()
                .AlignCenter()
                .Column(column =>
                {
                    column.Item().Text("SOCIALIST REPUBLIC OF VIETNAM")
                        .SemiBold().FontSize(14);

                    column.Item().Text("Independence - Freedom - Happiness")
                        .SemiBold().FontSize(12);

                    column.Item().PaddingBottom(10);
                });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(20);

                        column.Item().AlignCenter().Text("VEHICLE RENTAL CONTRACT")
                            .SemiBold().FontSize(16);

                        column.Item().Grid(grid =>
                        {
                            grid.Columns(2);
                            grid.Spacing(10);

                            grid.Item().Text("Contract ID:").SemiBold();
                            grid.Item().Text(contract.ContractId.ToString());

                            grid.Item().Text("Renter Name:").SemiBold();
                            grid.Item().Text(contract.EVRenter.Account.FullName);

                            grid.Item().Text("Vehicle:").SemiBold();
                            grid.Item().Text($"{contract.Vehicle.LicensePlate}");

                            grid.Item().Text("Station:").SemiBold();
                            grid.Item().Text(contract.Station.Name);

                            grid.Item().Text("Rental Period:").SemiBold();
                            grid.Item().Text($"{contract.StartTime:dd/MM/yyyy HH:mm} - {contract.EndTime:dd/MM/yyyy HH:mm}");

                            grid.Item().Text("Total Cost:").SemiBold();
                            grid.Item().Text($"{contract.TotalCost:N2} VND");

                            grid.Item().Text("Status:").SemiBold();
                            grid.Item().Text(contract.Status.ToString());
                        });

                        column.Item().Text("TERMS AND CONDITIONS").SemiBold().FontSize(14);
                        column.Item().Text("1. The renter is responsible for the vehicle during the rental period.");
                        column.Item().Text("2. Any damages must be reported immediately.");
                        column.Item().Text("3. Late returns will incur additional charges.");
                        column.Item().Text("4. Electricity is the responsibility of the renter.");

                        column.Item().Grid(grid =>
                        {
                            grid.Columns(2);
                            grid.Spacing(30);

                            grid.Item().Column(renterColumn =>
                            {
                                renterColumn.Item().Text("RENTER SIGNATURE").SemiBold();
                                renterColumn.Item().PaddingTop(30).LineHorizontal(1);
                                renterColumn.Item().Text(contract.EVRenter.Account.FullName);
                                renterColumn.Item().Text($"Date: {DateTime.Now:dd/MM/yyyy}");
                            });

                            grid.Item().Column(companyColumn =>
                            {
                                companyColumn.Item().Text("PUBLIC CAR RENTAL COMPANY").SemiBold();
                                companyColumn.Item().PaddingTop(30).LineHorizontal(1);
                                companyColumn.Item().Text("Authorized Representative");
                                companyColumn.Item().Text($"Date: {DateTime.Now:dd/MM/yyyy}");
                            });
                        });
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Page ");
                        x.CurrentPageNumber();
                        x.Span(" of ");
                        x.TotalPages();
                    });
            });
        });

        return document.GeneratePdf();
    }
}