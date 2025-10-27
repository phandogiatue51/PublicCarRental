namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class FleetManagementDto
    {
        public List<VehicleDistributionDto> VehicleDistributionByStation { get; set; }
        public int AvailableVehicles { get; set; }
        public int RentedVehicles { get; set; }
        public int MaintenanceVehicles { get; set; }
        public List<VehicleModelPerformanceDto> TopPerformingModels { get; set; }
    }
}
