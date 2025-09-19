using static System.Collections.Specialized.BitVector32;

namespace PublicCarRental.Models
{
    public class Vehicle
    {
        public Guid Id { get; set; }
        public string Model { get; set; }
        public string LicensePlate { get; set; }
        public int BatteryLevel { get; set; } // Percentage
        public string Status { get; set; } // Available, Rented, Maintenance
        public decimal PricePerHour { get; set; }

        public Guid StationId { get; set; }
        public Station Station { get; set; }

        public ICollection<RentalContract> RentalContracts { get; set; }
    }
}
