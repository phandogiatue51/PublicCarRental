using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Refund
{
    public class RefundResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int RefundId { get; set; }
        public RefundStatus Status { get; set; }
        public string? PayoutTransactionId { get; set; }
    }
}
