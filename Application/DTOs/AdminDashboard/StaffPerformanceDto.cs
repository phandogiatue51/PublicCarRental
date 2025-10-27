namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class StaffPerformanceDto
    {
        public int TotalStaff { get; set; }
        public int ActiveStaff { get; set; }
        public List<StaffMemberPerformanceDto> TopPerformers { get; set; }
        public double AverageCheckInsPerStaff { get; set; }
        public double AverageCheckOutsPerStaff { get; set; }
    }
}
