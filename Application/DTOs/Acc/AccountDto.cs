using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Acc
{
    public class AccountDto
    {
        public int Id { get; set; }
        public AccountRole Role { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string IdentityCardNumber { get; set; }
    }
}
