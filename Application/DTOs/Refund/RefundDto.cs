using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Refund
{
    public class RefundDto
    {
        public int RefundId { get; set; }
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; }
        public RefundStatus Status { get; set; }
        public DateTime RequestedDate { get; set; }
        public DateTime? ProcessedDate { get; set; }
        public int StaffId { get; set; }
        public string? PayoutTransactionId { get; set; }
        public string? Note { get; set; }
    }
}
