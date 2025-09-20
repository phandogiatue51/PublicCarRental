using PublicCarRental.Models;

namespace PublicCarRental.DTOs
{
    public class StaffRegistrationDto : AccountRegistrationDto
    {
        public int? StationId { get; set; }
    }
}
