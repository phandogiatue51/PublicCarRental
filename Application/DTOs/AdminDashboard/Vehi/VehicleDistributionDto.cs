namespace PublicCarRental.Application.DTOs.AdminDashboard.Vehi
{
    public class VehicleDistributionDto
    {
        public int StationId { get; set; }
        public string StationName { get; set; }
        public string StationAddress { get; set; }
        public int TotalVehicles { get; set; }
        public int AvailableVehicles { get; set; }
        public int RentedVehicles { get; set; }
        public int MaintenanceVehicles { get; set; }
        public double UtilizationRate { get; set; } // Percentage
    }
}
