using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.Application.DTOs.Acc
{
    public class EVRenterCreateDto
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
        [Required]
        public string LicenseNumber { get; set; }
    }
}
