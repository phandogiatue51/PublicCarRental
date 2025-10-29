namespace PublicCarRental.Application.DTOs.Veh
{
    public class FilterAvailable
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int? StationId { get; set; } = null;
    }
}
