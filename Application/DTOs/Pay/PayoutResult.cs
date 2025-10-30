namespace PublicCarRental.Application.DTOs.Pay
{
    public class PayoutResult
    {
        public bool Success { get; set; }
        public string TransactionId { get; set; }
        public string Status { get; set; }
        public string Message { get; set; }
    }
}
