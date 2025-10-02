using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Models
{
    public enum InvoiceStatus
    {
        Unpaid,
        Paid,
        Overdue
    }
    public class Invoice
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InvoiceId { get; set; }
        public int ContractId { get; set; }
        public RentalContract Contract { get; set; }
        public DateTime IssuedAt { get; set; }
        public decimal AmountDue { get; set; }
        public decimal? AmountPaid { get; set; }
        public DateTime? PaidAt { get; set; }

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Unpaid;

        public string? PaymentGateway { get; set; } // "VNPay"
        public string? PaymentTransactionId { get; set; } // VNPay's transaction ID
        public string? PaymentResponseCode { get; set; } // VNPay response code
        public string? PaymentSecureHash { get; set; } // VNPay security hash
        public DateTime? PaymentExpiryTime { get; set; } // When payment link expires
    }
}
