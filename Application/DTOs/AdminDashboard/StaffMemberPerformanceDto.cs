namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class StaffMemberPerformanceDto
    {
        public int StaffId { get; set; }
        public string FullName { get; set; }
        public string StationName { get; set; }
        public int TotalCheckIns { get; set; }
        public int TotalCheckOuts { get; set; }
        public int TotalRentalsProcessed { get; set; }
        public double CustomerSatisfactionScore { get; set; }
    }
}
