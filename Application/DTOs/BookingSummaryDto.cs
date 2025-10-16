namespace PublicCarRental.Application.DTOs
{
    public class BookingSummaryDto
    {
        public string BookingToken { get; set; }
        public string ModelName { get; set; }
        public string StationName { get; set; }
        public string RenterName { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalCost { get; set; }
        public string[] Terms { get; set; }
    }
}
