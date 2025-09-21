using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Models
{
    public enum RentalStatus
    {
        ToBeConfirmed,
        Active,
        Completed,
        Cancelled
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

        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public decimal? TotalCost { get; set; }
        public RentalStatus Status { get; set; } = RentalStatus.ToBeConfirmed;

        [InverseProperty("Contract")]
        public Invoice Invoice { get; set; }
    }
}
