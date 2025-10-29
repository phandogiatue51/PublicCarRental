using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Veh
{
    public class VehicleDto
    {
        public int VehicleId { get; set; }
        public string LicensePlate { get; set; }
        public int BatteryLevel { get; set; }
        public VehicleStatus Status { get; set; }

        public int? StationId { get; set; }
        public string? StationName { get; set; }

        public int ModelId { get; set; }
        public string ModelName { get; set; }
    }
}
