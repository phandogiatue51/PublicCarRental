namespace PublicCarRental.Application.DTOs.AdminDashboard.Revenue
{
    public class InvoiceFinancialReportDto
    {
        public DateRange Period { get; set; }
        public int TotalInvoices { get; set; }
        public decimal TotalInvoiceAmount { get; set; }
        public decimal TotalAmountPaid { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal TotalRefunds { get; set; }
        public decimal NetRevenue { get; set; }
        public int PartialRefundsCount { get; set; }
        public int FullRefundsCount { get; set; }
        public decimal CollectionRate { get; set; } // Percentage of invoiced amount that was collected
        public decimal RefundRate { get; set; } // Percentage of income that was refunded

        public List<RevenueByStationDto> RevenueByStation { get; set; } = new();
        public List<DailyRevenueDto> DailyRevenue { get; set; } = new();
        public List<RevenueByVehicleTypeDto> RevenueByVehicleType { get; set; } = new();
        public List<RefundByStationDto> RefundsByStation { get; set; } = new();
        public List<InvoiceStatusBreakdownDto> InvoiceStatusBreakdown { get; set; } = new();
    }
}
