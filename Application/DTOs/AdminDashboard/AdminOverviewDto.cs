namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class AdminOverviewDto
    {
        public int TotalStations { get; set; }
        public int TotalVehicles { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalStaff { get; set; }
        public int ActiveRentals { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public double SystemUtilizationRate { get; set; } 
    }

}
