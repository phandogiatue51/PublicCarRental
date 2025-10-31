using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public enum InvoiceStatus
    {
        Pending,
        Paid,
        Overdue,
        Cancelled,
        Refunded,
        PartiallyRefunded
    }

    public class Invoice
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InvoiceId { get; set; }

        public int? ContractId { get; set; }
        public RentalContract? Contract { get; set; }

        public DateTime IssuedAt { get; set; }
        public decimal AmountDue { get; set; }
        public decimal? AmountPaid { get; set; }
        public DateTime? PaidAt { get; set; }
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;
        public int? OrderCode { get; set; }

        public string? BookingToken { get; set; }
        public string? Note { get; set; }
        public decimal? RefundAmount { get; set; }
        public DateTime? RefundedAt { get; set; }

        public int? TransactionId { get; set; }
        public Transaction? Transaction { get; set; }
        public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
    }
}