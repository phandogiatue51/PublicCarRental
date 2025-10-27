namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class FinancialReportDto
    {
        public DateRange Period { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalDeposits { get; set; }
        public decimal TotalRefunds { get; set; }
        public decimal NetRevenue { get; set; }
        public List<RevenueByStationDto> RevenueByStation { get; set; }
        public List<DailyRevenueDto> DailyRevenue { get; set; }
        public List<RevenueByVehicleTypeDto> RevenueByVehicleType { get; set; }
    }
}
