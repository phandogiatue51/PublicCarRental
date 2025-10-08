using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.Application.DTOs.Staf
{
    public class StaffDto
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
        public int? StationId { get; set; }
    }
}
