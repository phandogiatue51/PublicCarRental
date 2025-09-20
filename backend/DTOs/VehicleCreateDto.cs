using PublicCarRental.Models;

namespace PublicCarRental.DTOs
{
    public class VehicleCreateDto
    {
        public int ModelId { get; set; }
        public string LicensePlate { get; set; }
        public int BatteryLevel { get; set; }
        public decimal PricePerHour { get; set; }
        public int? StationId { get; set; }
    }
}
