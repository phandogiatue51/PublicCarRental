using PublicCarRental.Infrastructure.Data.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
namespace PublicCarRental.Application.Service.PDF;

public interface IPdfService
{
    public byte[] GenerateRentalContract(RentalContract contract, string staffName = null);
    public byte[] GeneratePaymentReceipt(Invoice invoice, RentalContract contract = null);

}

public class PdfService : IPdfService
{
    public byte[] GenerateRentalContract(RentalContract contract, string staffName = null)
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
                        column.Spacing(15);

                        // Contract Title
                        column.Item().AlignCenter().Text("VEHICLE RENTAL CONTRACT")
                            .SemiBold().FontSize(16);

                        column.Item().AlignCenter().Text("(Electric Vehicle)")
                            .Italic().FontSize(12);

                        // Today's date
                        column.Item().AlignRight().Text($"Today's date: {DateTime.Now:dd/MM/yyyy}")
                            .FontSize(11);

                        // Parties Section
                        column.Item().Text("PARTIES:").SemiBold().FontSize(14);

                        column.Item().PaddingBottom(10).Text("Party A (Lessor): CAR777 COMPANY");
                        column.Item().Text($"Address: {contract.Vehicle?.Station?.Name ?? "N/A"}");
                        column.Item().Text($"Represented by: {staffName ?? "N/A"}");
                        column.Item().Text($"Phone: {contract.Staff?.Account?.PhoneNumber ?? "N/A"}");
                        column.Item().Text("Position: Staff");

                        column.Item().PaddingTop(10).Text("Party B (Lessee):").SemiBold();
                        column.Item().Text($"Full name: {contract.EVRenter?.Account?.FullName ?? "N/A"}");
                        column.Item().Text($"ID Card/Passport: {contract.EVRenter?.Account?.IdentityCardNumber ?? "N/A"}");
                        column.Item().Text($"Phone: {contract.EVRenter?.Account?.PhoneNumber ?? "N/A"}");

                        column.Item().Text("Based on the needs and capabilities of both parties,").Italic();
                        column.Item().Text("the two parties agree to enter into this Vehicle Rental Contract with the following terms:")
                            .Italic();

                        // Article 1: Vehicle Information
                        column.Item().Text("ARTICLE 1: VEHICLE INFORMATION").SemiBold().FontSize(12);
                        column.Item().Grid(grid =>
                        {
                            grid.Columns(2);
                            grid.Spacing(8);

                            grid.Item().Text("License plate:").SemiBold();
                            grid.Item().Text(contract.Vehicle?.LicensePlate ?? "N/A");

                            grid.Item().Text("Vehicle type:").SemiBold();
                            grid.Item().Text(contract.Vehicle?.Model?.Type?.Name ?? "Electric Car");

                            grid.Item().Text("Model:").SemiBold();
                            grid.Item().Text(contract.Vehicle?.Model?.Name ?? "N/A");

                            grid.Item().Text("Brand:").SemiBold();
                            grid.Item().Text(contract.Vehicle?.Model?.Brand?.Name ?? "VinFast");
                        });

                        // Article 2: Rental Period and Location
                        column.Item().Text("ARTICLE 2: RENTAL PERIOD AND LOCATION").SemiBold().FontSize(12);
                        column.Item().Text($"Rental period: From {contract.StartTime:HH:mm dd/MM/yyyy} to {contract.EndTime:HH:mm dd/MM/yyyy}");
                        column.Item().Text($"Pick-up and return location: {contract.Station?.Name ?? "N/A"}");
                        column.Item().Text($"Address: {contract.Station?.Address ?? "N/A"}");

                        // Article 3: Rental Fee and Payment
                        column.Item().Text("ARTICLE 3: RENTAL FEE AND PAYMENT").SemiBold().FontSize(12);
                        column.Item().Text($"Rental fee: {contract.Vehicle?.Model?.PricePerHour:N0} VND/hour");
                        column.Item().Text($"Estimated total: {contract.TotalCost:N0} VND");
                        column.Item().Text("Payment method: Paid in advance via electronic payment");
                        column.Item().Text("Note: Final amount will be calculated based on actual usage time");

                        // Article 4: Rights and Obligations of Party A (Lessor)
                        column.Item().Text("ARTICLE 4: RIGHTS AND OBLIGATIONS OF PARTY A (LESSOR)").SemiBold().FontSize(12);
                        column.Item().Text("1. Provide the vehicle in good technical condition, clean, with sufficient fuel/battery as committed.");
                        column.Item().Text("2. Guide Party B on vehicle operation and usage procedures.");
                        column.Item().Text("3. Resolve technical issues arising during the rental period (excluding cases due to Party B's fault).");
                        column.Item().Text("4. Receive the vehicle back according to the agreed time and condition.");

                        // Article 5: Rights and Obligations of Party B (Lessee)
                        column.Item().Text("ARTICLE 5: RIGHTS AND OBLIGATIONS OF PARTY B (LESSEE)").SemiBold().FontSize(12);
                        column.Item().Text("1. Use the vehicle for the correct purpose, preserve and maintain the vehicle.");
                        column.Item().Text("2. Pay full rental fee and other arising fees (if any).");
                        column.Item().Text("3. Bear all costs of fuel, electricity, tolls, parking fees during the rental period.");
                        column.Item().Text("4. Comply with traffic laws; bear responsibility for traffic violations during the rental period.");
                        column.Item().Text("5. Do not sublease, transfer, or use the vehicle for illegal purposes.");
                        column.Item().Text("6. Return the vehicle on time at the agreed location.");
                        column.Item().Text("7. Compensate for damages if the vehicle is damaged or lost due to Party B's fault.");

                        // Article 6: Vehicle Condition
                        column.Item().Text("ARTICLE 6: VEHICLE CONDITION").SemiBold().FontSize(12);
                        column.Item().Text($"Current mileage/battery level: {contract.Vehicle?.BatteryLevel ?? 0} km/%");
                        column.Item().Text($"Condition: {contract.Note ?? "Fine"}");

                        // Article 7: Contract Termination
                        column.Item().Text("ARTICLE 7: CONTRACT TERMINATION").SemiBold().FontSize(12);
                        column.Item().Text("This contract terminates when:");
                        column.Item().Text("- The rental period expires and Party B returns the vehicle to Party A");
                        column.Item().Text("- Either party unilaterally terminates the contract and compensates for damages (if any)");
                        column.Item().Text("- Force majeure events occur");

                        // Article 8: Dispute Resolution
                        column.Item().Text("ARTICLE 8: DISPUTE RESOLUTION").SemiBold().FontSize(12);
                        column.Item().Text("Any disputes arising from this contract shall be first resolved through negotiation.");
                        column.Item().Text("If negotiation fails, the dispute shall be resolved according to Vietnamese law at the competent court.");

                        // Article 9: Effective Date
                        column.Item().Text("ARTICLE 9: EFFECTIVE DATE").SemiBold().FontSize(12);
                        column.Item().Text("This contract is made in 02 (two) copies of equal validity, each party keeps 01 (one) copy,");
                        column.Item().Text("and takes effect from the time of signing by both parties.");

                        // Signatures Section
                        column.Item().PaddingTop(20).Grid(grid =>
                        {
                            grid.Columns(2);
                            grid.Spacing(30);

                            // Party B (Lessee)
                            grid.Item().Column(partyBColumn =>
                            {
                                partyBColumn.Item().AlignCenter().Text("PARTY B (LESSEE)").SemiBold().FontSize(12);
                                partyBColumn.Item().PaddingTop(20).AlignCenter().Text("Signature and Full Name");
                                partyBColumn.Item().PaddingTop(40).AlignCenter().LineHorizontal(2);
                                partyBColumn.Item().AlignCenter().Text(contract.EVRenter?.Account?.FullName ?? "N/A");
                            });

                            // Party A (Lessor)
                            grid.Item().Column(partyAColumn =>
                            {
                                partyAColumn.Item().AlignCenter().Text("PARTY A (LESSOR)").SemiBold().FontSize(12);
                                partyAColumn.Item().AlignCenter().Text("CAR777 COMPANY");
                                partyAColumn.Item().PaddingTop(20).AlignCenter().Text("Representative");
                                partyAColumn.Item().PaddingTop(40).AlignCenter().LineHorizontal(2);
                                partyAColumn.Item().AlignCenter().Text(staffName ?? "N/A");
                                partyAColumn.Item().AlignCenter().Text("(Authorized Staff)");
                            });
                        });
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Contract ID: CT-");
                        x.Span(contract.ContractId.ToString("D6"));
                        x.Span(" | Page ");
                        x.CurrentPageNumber();
                        x.Span(" of ");
                        x.TotalPages();
                    });
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GeneratePaymentReceipt(Invoice invoice, RentalContract contract = null)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header()
                    .AlignCenter()
                    .Column(column =>
                    {
                        column.Item().Text("CAR777")
                            .Bold().FontSize(16);

                        column.Item().Text("Payment Receipt")
                            .SemiBold().FontSize(14);

                        column.Item().PaddingBottom(5);
                        column.Item().LineHorizontal(1);
                    });

                page.Content()
                    .PaddingVertical(0.5f, Unit.Centimetre)
                    .Column(column =>
                    {
                        column.Spacing(15);

                        // Receipt Header
                        column.Item().Grid(grid =>
                        {
                            grid.Columns(2);
                            grid.Spacing(10);

                            grid.Item().Text("Receipt No:").SemiBold();
                            grid.Item().Text($"INV-{invoice.InvoiceId:D6}");

                            grid.Item().Text("Issue Date:").SemiBold();
                            grid.Item().Text(invoice.PaidAt?.ToString("dd/MM/yyyy HH:mm") ?? "N/A");

                            grid.Item().Text("Order Code:").SemiBold();
                            grid.Item().Text(invoice.OrderCode?.ToString() ?? "N/A");
                        });

                        column.Item().LineHorizontal(0.5f);

                        // Payment Details
                        column.Item().Text("PAYMENT DETAILS").SemiBold().FontSize(12);
                        column.Item().Grid(grid =>
                        {
                            grid.Columns(2);
                            grid.Spacing(8);

                            grid.Item().Text("Amount Paid:").SemiBold();
                            grid.Item().Text($"{invoice.AmountPaid?.ToString("N0") ?? "0"} VND");

                            grid.Item().Text("Payment Method:").SemiBold();
                            grid.Item().Text("PayOS Gateway");

                            grid.Item().Text("Payment Status:").SemiBold();
                            grid.Item().Text("PAID");

                            grid.Item().Text("Payment Date:").SemiBold();
                            grid.Item().Text(invoice.PaidAt?.ToString("dd/MM/yyyy HH:mm") ?? "N/A");
                        });

                        column.Item().LineHorizontal(0.5f);
                        column.Item().Text("BOOKING INFORMATION").SemiBold().FontSize(12);
                        column.Item().Grid(grid =>
                        {
                            grid.Columns(2);
                            grid.Spacing(8);

                            grid.Item().Text("Booking Ref:").SemiBold();
                            grid.Item().Text($"CT-{contract.ContractId:D6}");

                            grid.Item().Text("Customer:").SemiBold();
                            grid.Item().Text(contract.EVRenter?.Account?.FullName ?? "N/A");

                            grid.Item().Text("Vehicle:").SemiBold();
                            grid.Item().Text($"{contract.Vehicle?.Model?.Name}");

                            grid.Item().Text("Station:").SemiBold();
                            grid.Item().Text(contract.Station?.Name ?? "N/A");

                            grid.Item().Text("Rental Period:").SemiBold();
                            grid.Item().Text($"{contract.StartTime:dd/MM/yyyy HH:mm} to {contract.EndTime:dd/MM/yyyy HH:mm}");

                            grid.Item().Text("Duration:").SemiBold();
                            var duration = (contract.EndTime - contract.StartTime).TotalHours;
                            grid.Item().Text($"{duration:F1} hours");
                        });

                        // Thank You Message
                        column.Item().PaddingTop(20).AlignCenter().Column(thankYouColumn =>
                        {
                            thankYouColumn.Item().Text("Thank you for your payment!")
                                .SemiBold().FontSize(12);

                            thankYouColumn.Item().Text("Your booking has been confirmed.")
                                .FontSize(10);

                            thankYouColumn.Item().Text("Please present this receipt when picking up your vehicle.")
                                .Italic().FontSize(9);
                        });

                        // Contact Information
                        column.Item().PaddingTop(15).AlignCenter().Column(contactColumn =>
                        {
                            contactColumn.Item().Text("Contact Information").SemiBold().FontSize(10);
                            contactColumn.Item().Text("Email: publiccarrental987@gmail.com | Phone: 0901 697 330")
                                .FontSize(9);
                            contactColumn.Item().Text("Website: www.fortunate-art-production.up.railway.app")
                                .FontSize(9);
                        });
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("This is an computer-generated receipt. No signature required. | ");
                        x.Span("Generated on: ");
                        x.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm"));
                    });
            });
        });

        return document.GeneratePdf();
    }
}