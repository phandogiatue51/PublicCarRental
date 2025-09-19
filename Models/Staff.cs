namespace PublicCarRental.Models
{
    public class Staff
    {
        public Guid Id { get; set; }
        public Guid AccountId { get; set; }
        public Account Account { get; set; }
        public Guid StationId { get; set; }
        public Station Station { get; set; }
    }
}
