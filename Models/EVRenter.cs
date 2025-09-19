namespace PublicCarRental.Models
{
    public class EVRenter
    {
        public Guid Id { get; set; }
        public Guid AccountId { get; set; }
        public Account Account { get; set; }
        public string PhoneNumber { get; set; }
        public string LicenseNumber { get; set; }
        public string IdentityCardNumber { get; set; }
        public DateTime RegisteredAt { get; set; }

        public ICollection<RentalContract> RentalContracts { get; set; }
    }
}
