namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class StationPerformanceDto
    {
        public int StationId { get; set; }
        public string StationName { get; set; }
        public int TotalVehicles { get; set; }
        public int ActiveRentals { get; set; }
        public decimal Revenue { get; set; }
        public double UtilizationRate { get; set; }
    }
}
