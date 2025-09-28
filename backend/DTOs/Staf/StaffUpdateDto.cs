using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.DTOs.Staf
{
    public class StaffUpdateDto
    {
        [Required]
        public string FullName { get; set; }
        [Required]
        public string Email { get; set; }
        public string? Password { get; set; } // Optional for updates
        [Required]
        public string PhoneNumber { get; set; }
        [Required]
        public string IdentityCardNumber { get; set; }
        public int? StationId { get; set; }
    }
}
