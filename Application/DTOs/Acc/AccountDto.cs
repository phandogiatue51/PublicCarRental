using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.Application.DTOs.Acc
{
    public class AccountDto
    {
        [Required]
        public string FullName { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        public string PhoneNumber { get; set; }
        [Required]
        public string IdentityCardNumber { get; set; }
        public string LicenseNumber { get; set; }
    }
}
