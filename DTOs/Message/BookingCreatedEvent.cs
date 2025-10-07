namespace PublicCarRental.DTOs.Message
{
    public class BookingCreatedEvent
    {
        public int BookingId { get; set; }
        public int RenterId { get; set; }
        public string RenterEmail { get; set; }
        public string RenterName { get; set; }
        public int VehicleId { get; set; }
        public string VehicleLicensePlate { get; set; }
        public int StationId { get; set; }
        public string StationName { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalCost { get; set; }
        public DateTime EventTime { get; set; } = DateTime.UtcNow;
        public string EventType { get; set; } = "BookingCreated";
    }
}
