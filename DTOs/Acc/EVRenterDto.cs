using PublicCarRental.Models;

namespace PublicCarRental.DTOs.Acc
{
    public class EVRenterDto
    {
        public int RenterId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string IdentityCardNumber { get; set; }
        public string? LicenseNumber { get; set; }
        public AccountStatus Status { get; set; }
    }
}