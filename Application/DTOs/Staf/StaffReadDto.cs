using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Staf
{
    public class StaffReadDto
    {
        public int StaffId { get; set; }
        public int AccountId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string IdentityCardNumber { get; set; }
        public int? StationId { get; set; }
        public AccountStatus Status { get; set; }
    }
}
