namespace PublicCarRental.DTOs
{
    public class StaffRegistrationDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; } // Needed to hash and store
        public string Role { get; set; } = "Staff"; // Optional default
        public Guid StationId { get; set; }
    }
}
