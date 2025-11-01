namespace PublicCarRental.Application.DTOs.BadScenario
{
    public class RefundScenarioRequest
    {
        public string Reason { get; set; }
        public int StaffId { get; set; }
        public string? Note { get; set; }
    }

    public class StaffVehicleProblemRequest : RefundScenarioRequest
    {
        public VehicleProblemType ProblemType { get; set; }
        public int StaffId { get; set; }
        public string Reason { get; set; }
        public string Note { get; set; }

        public int? NewVehicleId { get; set; }
        public int? NewModelId { get; set; }

        public bool IsAutomaticReplacement { get; set; } = false;
    }

    public class RenterChangeRequest : RefundScenarioRequest
    {
        public ChangeType ChangeType { get; set; }
        public int? NewModelId { get; set; }
        public int? NewVehicleId { get; set; } 
        public DateTime? NewEndTime { get; set; }
    }

    public enum VehicleProblemType
    {
        Maintenance,
        Accident,
        MechanicalIssue,
        Unavailable
    }

    public enum ChangeType
    {
        CancelContract,
        ChangeModel,
        ChangeVehicle
    }
}