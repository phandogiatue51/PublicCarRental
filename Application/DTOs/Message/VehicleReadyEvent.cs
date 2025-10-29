namespace PublicCarRental.Application.DTOs.Message
{
    public class VehicleReadyEvent
    {
        public string EventType => "VehicleReady";
        public int AccidentId { get; set; }
        public int VehicleId { get; set; }
        public string LicensePlate { get; set; }
        public int StationId { get; set; }
        public DateTime ReadyAt { get; set; } = DateTime.UtcNow;
    }
}
