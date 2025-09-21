using PublicCarRental.Models;

namespace PublicCarRental.DTOs.Inv
{
    public class InvoiceDto
    {
        public int InvoiceId { get; set; }
        public int ContractId { get; set; }
        public DateTime IssuedAt { get; set; }

        public decimal AmountDue { get; set; }
        public decimal? AmountPaid { get; set; }
        public DateTime? PaidAt { get; set; }

        public InvoiceStatus Status { get; set; }
    }
}
