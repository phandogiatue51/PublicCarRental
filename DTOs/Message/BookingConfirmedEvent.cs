namespace PublicCarRental.DTOs.Message
{
    public class BookingConfirmedEvent
    {
        public int BookingId { get; set; }
        public string RenterEmail { get; set; }
        public string RenterName { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalCost { get; set; }
        public DateTime EventTime { get; set; } = DateTime.UtcNow;
        public string EventType { get; set; } = "BookingConfirmed";
    }
}
