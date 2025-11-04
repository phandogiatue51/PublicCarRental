namespace PublicCarRental.Application.DTOs.Mod
{
    public class ModelAvailabilityRequest
    {
        public int StationId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}
