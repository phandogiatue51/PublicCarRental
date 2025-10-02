using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Models
{
    public enum TransactionType
    {
        Income,
        Refund,
        Deposit,
        Withdrawal,
        Adjustment
    }

    public class Transaction
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TransactionId { get; set; }

        public int ContractId { get; set; }
        [ForeignKey("ContractId")]
        public RentalContract Contract { get; set; }

        public TransactionType Type { get; set; }
        public decimal Amount { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Note { get; set; }
    }
}
