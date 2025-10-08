namespace PublicCarRental.Application.DTOs.Veh
{
    public class AvailableVehicle
    {
        public int ModelId { get; set; }
        public int StationId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}
