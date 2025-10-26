namespace PublicCarRental.Application.DTOs.Stat
{
    public class StationDtoForView
    {
        public int StationId { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}
