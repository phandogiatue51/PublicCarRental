namespace PublicCarRental.Application.DTOs.AdminDashboard.Customer
{
    public class CustomerSegmentDto
    {
        public string Segment { get; set; } // "New", "Regular", "Inactive"
        public int Count { get; set; }
        public decimal AverageRevenue { get; set; }
    }
}
