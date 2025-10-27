namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class VehicleModelPerformanceDto
    {
        public int ModelId { get; set; }
        public string ModelName { get; set; }
        public string BrandName { get; set; }
        public int TotalRentals { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AverageRating { get; set; }
        public double UtilizationRate { get; set; } // Percentage
        public int TotalVehicles { get; set; }
    }
}
