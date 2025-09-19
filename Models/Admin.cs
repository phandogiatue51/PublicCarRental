namespace PublicCarRental.Models
{
    public class Admin
    {
        public Guid Id { get; set; }
        public Guid AccountId { get; set; }
        public Account Account { get; set; }

    }
}
