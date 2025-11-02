namespace PublicCarRental.Infrastructure.Data.Models
{
    public class AccidentReport
    {
        public int AccidentId { get; set; }
        public int VehicleId { get; set; }
        public int? ContractId { get; set; }
        public int? StaffId { get; set; }
        public string? Description { get; set; }
        public string? Location { get; set; }
        public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
        public AccidentStatus Status { get; set; } = AccidentStatus.Reported;
        public string? ImageUrl { get; set; }

        public string? ResolutionNote { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public ActionType? ActionTaken { get; set; }

        public Vehicle Vehicle { get; set; }
        public RentalContract Contract { get; set; }
    }

    public enum AccidentStatus
    {
        Reported,
        UnderInvestigation,
        RepairApproved,
        UnderRepair,
        Repaired,
    }
    public enum ActionType
    {
        Refund,
        Replace,
        RepairOnly
    }
}
