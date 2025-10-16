namespace PublicCarRental.Application.DTOs
{
    public class BookingRequest
    {
        public string BookingToken { get; set; } = Guid.NewGuid().ToString();
        public int EVRenterId { get; set; }
        public int ModelId { get; set; }
        public int StationId { get; set; }
        public int VehicleId { get; set; } 
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalCost { get; set; }
        public int InvoiceId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
