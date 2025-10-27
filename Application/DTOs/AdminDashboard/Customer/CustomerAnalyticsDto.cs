using PublicCarRental.Application.DTOs.AdminDashboard.Customer;

namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class CustomerAnalyticsDto
    {
        public int TotalCustomers { get; set; }
        public int NewCustomersThisMonth { get; set; }
        public int ActiveCustomers { get; set; } // Rented in last 30 days
        public double AverageRentalsPerCustomer { get; set; }
        public decimal AverageSpendingPerCustomer { get; set; }
        public List<CustomerSegmentDto> CustomerSegments { get; set; }
    }
}
