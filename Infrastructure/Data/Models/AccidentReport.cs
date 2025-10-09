namespace PublicCarRental.Infrastructure.Data.Models
{
    public class AccidentReport
    {
        public int AccidentId { get; set; }
        public int VehicleId { get; set; }
        public int? ContractId { get; set; } 
        public int? ReportingUserId { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
        public DateTime ReportedAt { get; set; }
        public AccidentStatus Status { get; set; }
        public string ImageUrl { get; set; }

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
}
