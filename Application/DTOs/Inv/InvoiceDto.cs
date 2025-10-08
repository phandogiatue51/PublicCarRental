using Microsoft.AspNetCore.Http.HttpResults;
using PublicCarRental.Infrastructure.Data.Models;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Application.DTOs.Inv
{
    public class InvoiceDto
    {
        public int InvoiceId { get; set; }
        public int ContractId { get; set; }
        public DateTime IssuedAt { get; set; }

        public decimal AmountDue { get; set; }
        public decimal? AmountPaid { get; set; }
        public DateTime? PaidAt { get; set; }

        public DateTime PaymentDeadline => IssuedAt.AddMinutes(30);
        public bool IsExpired => DateTime.UtcNow > PaymentDeadline;

        public InvoiceStatus Status { get; set; }
    }
}
