namespace PublicCarRental.Application.DTOs.Pay
{
    public class PayoutInfo
    {
        public string TransactionId { get; set; }
        public string Status { get; set; }
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
