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
    }
}
