using PublicCarRental.Models;
using PublicCarRental.Repository;

namespace PublicCarRental.DTOs
{
    public class AccountRegistrationDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string PhoneNumber { get; set; }
        public string IdentityCardNumber { get; set; }
        public string? LicenseNumber { get; set; }
        public AccountStatus Status { get; set; } = AccountStatus.Active;
    }
}
