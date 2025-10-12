namespace PublicCarRental.Application.DTOs.Message
{
    public class AccidentReportedEvent
    {
        public int AccidentId { get; set; }
        public int? ContractId { get; set; }
        public int VehicleId { get; set; }
        public int? StaffId { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
        public DateTime ReportedAt { get; set; }
        public string ImageUrl { get; set; }
        public string? VehicleLicensePlate { get; set; } 
    }
}
