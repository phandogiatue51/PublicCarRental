namespace PublicCarRental.DTOs.Veh
{
    public class AvailableVehicle
    {
        public int modelId { get; set; }
        public int stationId { get; set; }
        public DateTime startTime { get; set; }
        public DateTime endTime { get; set; }
    }
}
