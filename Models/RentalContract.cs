namespace PublicCarRental.Models
{
    public class RentalContract
    {
        public Guid Id { get; set; }
        public Guid EVRenterId { get; set; }
        public EVRenter EVRenter { get; set; }

        public Guid VehicleId { get; set; }
        public Vehicle Vehicle { get; set; }

        public Guid StationId { get; set; }
        public Station Station { get; set; }

        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public decimal TotalCost { get; set; }
        public string Status { get; set; } // Active, Completed, Cancelled

        public string VehicleConditionOnPickup { get; set; }
        public string VehicleConditionOnReturn { get; set; }
    }
}
