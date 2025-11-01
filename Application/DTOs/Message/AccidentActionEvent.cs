using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Message
{
    public class AccidentActionEvent
    {
        public int AccidentId { get; set; }
        public int VehicleId { get; set; }
        public AccidentStatus Status { get; set; }
        public ActionType? ActionTaken { get; set; }
        public string ResolutionNote { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string VehicleLicensePlate { get; set; }

        public int StationId { get; set; }
        public int? StaffId { get; set; }
    }
}
