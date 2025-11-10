using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public enum RefundStatus
    {
        Pending,    // Waiting for approval
        Approved,   // Manager approved
        Processing, // PayOS payout in progress
        Completed,  // Money sent to customer
        Failed,     // Payout failed
        Rejected    // Manager rejected
    }

    public class Refund
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RefundId { get; set; }

        public int InvoiceId { get; set; }
        [ForeignKey("InvoiceId")]
        public Invoice Invoice { get; set; }

        public decimal Amount { get; set; }
        public string Reason { get; set; }
        public RefundStatus Status { get; set; } = RefundStatus.Pending;

        public DateTime RequestedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedDate { get; set; }

        public string? PayoutTransactionId { get; set; }
        public string? Note { get; set; }
    }

}
