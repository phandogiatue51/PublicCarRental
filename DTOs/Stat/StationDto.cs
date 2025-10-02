namespace PublicCarRental.DTOs.Stat
{
    public class StationDto
    {
        public int StationId { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public int VehicleCount { get; set; }
        public int StaffCount { get; set; }
    }
}
