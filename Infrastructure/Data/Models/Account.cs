using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public enum AccountRole
    {
        EVRenter,
        Staff,
        Admin
    }
    public enum AccountStatus
    {
        Active,
        Inactive,
        Suspended
    }
    public class Account
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AccountId { get; set; } 
        public string? FullName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string? PhoneNumber { get; set; }
        public AccountStatus Status { get; set; } = AccountStatus.Active;
        public DateTime RegisteredAt { get; set; }
        public AccountRole Role { get; set; }
        public string? EmailVerificationToken { get; set; }
        public bool IsEmailVerified { get; set; } = false;
        public string? IdentityCardNumber { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetRequestedAt { get; set; }

        public ICollection<Favorite> Favorites { get; set; }
        public virtual ICollection<AccountDocument> AccountDocuments { get; set; }

    }
}
