namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class RevenueByStationDto
    {
        public int StationId { get; set; }
        public string StationName { get; set; }
        public decimal Revenue { get; set; }
        public int TotalRentals { get; set; }
    }
}
