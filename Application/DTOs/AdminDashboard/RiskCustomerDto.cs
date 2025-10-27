namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class RiskCustomerDto
    {
        public int CustomerId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string LicenseNumber { get; set; }
        public int TotalRentals { get; set; }
        public int ViolationCount { get; set; }
        public int DamageReportCount { get; set; }
        public int LateReturnCount { get; set; }
        public string RiskLevel { get; set; } // Low, Medium, High
        public DateTime LastRentalDate { get; set; }
    }
}
