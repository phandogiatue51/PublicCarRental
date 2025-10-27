using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.StaffDashboard
{
    public class VehicleAtStationDto
    {
        public int VehicleId { get; set; }
        public string LicensePlate { get; set; }
        public string VehicleModel { get; set; }
        public string Brand { get; set; }
        public int BatteryLevel { get; set; }
        public VehicleStatus Status { get; set; }
        public DateTime? LastMaintenanceDate { get; set; }
        public string? CurrentIssue { get; set; } 
        public int? CurrentRentalContractId { get; set; } 
    }
}
