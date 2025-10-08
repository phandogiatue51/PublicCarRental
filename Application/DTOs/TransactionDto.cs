using PublicCarRental.Infrastructure.Data.Models;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Application.DTOs
{
    public class TransactionDto
    {
        public int TransactionId { get; set; }

        public int ContractId { get; set; }
        public TransactionType Type { get; set; }
        public decimal Amount { get; set; }
        public DateTime Timestamp { get; set; }
        public string Note { get; set; }
    }
}
