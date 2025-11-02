namespace PublicCarRental.Application.DTOs.Accident
{
    public class ContractReplacementPreview
    {
        public int ContractId { get; set; }
        public string RenterName { get; set; }
        public DateTime StartTime { get; set; }
        public int CurrentVehicleId { get; set; }
        public int? NewVehicleId { get; set; }
        public string NewVehicleInfo { get; set; }
        public bool WillBeReplaced { get; set; }
        public string ReplacementType { get; set; }
        public string Reason { get; set; }
    }
}