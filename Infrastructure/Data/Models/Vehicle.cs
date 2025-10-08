using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static System.Collections.Specialized.BitVector32;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public enum VehicleStatus
    {
        ToBeRented,
        Renting,
        Charging,
        ToBeCheckup,
        InMaintenance,
        Available
    }
    public class Vehicle
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int VehicleId { get; set; }
        public string LicensePlate { get; set; }
        public int BatteryLevel { get; set; }
        public VehicleStatus Status { get; set; } = VehicleStatus.Available;
        public int? StationId { get; set; }
        public Station Station { get; set; }
        public int ModelId { get; set; }
        public VehicleModel Model { get; set; }
        public ICollection<RentalContract> RentalContracts { get; set; }
    }
}
