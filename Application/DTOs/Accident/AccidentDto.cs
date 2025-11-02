using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Accident
{
    public class AccidentDto
    {
        public int AccidentId { get; set; }
        public int VehicleId { get; set; }
        public string LicensePlate { get; set; }
        public int? ContractId { get; set; }
        public int? StaffId { get; set; }
        public string? StaffName { get; set; }
        public string Description { get; set; }
        public int? StationId { get; set; }
        public string Location { get; set; }
        public DateTime ReportedAt { get; set; }
        public AccidentStatus Status { get; set; }
        public string? ImageUrl { get; set; } = null;
        public string? ResolutionNote { get; set; } = null;
        public ActionType? ActionTaken { get; set; } = null;
    }
}
