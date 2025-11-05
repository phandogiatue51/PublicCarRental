namespace PublicCarRental.Application.DTOs.AdminDashboard.Revenue
{
    public class RefundByStationDto
    {
        public int StationId { get; set; }
        public string StationName { get; set; }
        public decimal RefundAmount { get; set; }
        public int RefundCount { get; set; }
    }
}
