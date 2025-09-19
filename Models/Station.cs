namespace PublicCarRental.Models
{
    public class Station
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public ICollection<Vehicle> Vehicles { get; set; }
        public ICollection<Staff> StaffMembers { get; set; }

        public ICollection<RentalContract> RentalContracts { get; set; }
    }
}
