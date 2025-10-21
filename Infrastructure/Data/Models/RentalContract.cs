using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public enum RentalStatus
    {
        ToBeConfirmed,
        Active,
        Completed,
        Cancelled,
        Confirmed
    }
    public class RentalContract
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ContractId { get; set; }
        public int EVRenterId { get; set; }
        public EVRenter EVRenter { get; set; }

        public int? StaffId { get; set; }
        public Staff Staff { get; set; }

        public int? VehicleId { get; set; }
        public Vehicle Vehicle { get; set; }

        public int? StationId { get; set; }
        public Station Station { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal? TotalCost { get; set; }
        public RentalStatus Status { get; set; } = RentalStatus.ToBeConfirmed;

        public ICollection<Invoice> Invoices { get; set; }  
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? ImageUrlIn { get; set; }
        public string? ImageUrlOut { get; set; }
        public string? Note {  get; set; }
        public Rating Rating { get; set; }
    }
}