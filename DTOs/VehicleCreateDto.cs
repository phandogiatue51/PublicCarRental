namespace PublicCarRental.DTOs
{
    public class VehicleCreateDto
    {
        public string Model { get; set; }
        public string LicensePlate { get; set; }
        public int BatteryLevel { get; set; }
        public decimal PricePerHour { get; set; }
        public Guid StationId { get; set; }
    }
}
