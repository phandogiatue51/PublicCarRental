using PublicCarRental.Models;

namespace PublicCarRental.DTOs.Veh
{
    public class VehicleFilter
    {
        public int VehicleId { get; set; }
        public string LicensePlate { get; set; }
        public int BatteryLevel { get; set; }
        public VehicleStatus Status { get; set; }
        public int? StationId { get; set; }
        public string StationName { get; set; }
        public int ModelId { get; set; }
        public string ModelName { get; set; }
        public int BrandId { get; set; }
        public string BrandName { get; set; }
        public int TypeId { get; set; }
        public string TypeName { get; set; }
        public decimal PricePerHour { get; set; }
        public string ImageUrl { get; set; }
    }
}
