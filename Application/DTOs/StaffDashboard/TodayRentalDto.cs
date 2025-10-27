namespace PublicCarRental.Application.DTOs.StaffDashboard
{
    public class TodayRentalDto
    {
        public int ContractId { get; set; }
        public string CustomerName { get; set; }
        public string LicensePlate { get; set; }
        public string VehicleModel { get; set; }
        public DateTime ScheduledTime { get; set; }
        public string CustomerPhone { get; set; } 
        public string LicenseNumber { get; set; } 
    }
}
