namespace PublicCarRental.Models
{
    public class Account
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; } // "EVRenter", "Staff", "Admin"

        public EVRenter EVRenter { get; set; }
        public Staff Staff { get; set; }
        public Admin Admin { get; set; }
    }
}
