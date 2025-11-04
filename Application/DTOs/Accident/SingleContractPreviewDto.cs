namespace PublicCarRental.Application.DTOs.Accident
{
    public class SingleContractPreviewDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public bool WillBeReplaced { get; set; }
        public int ContractId { get; set; }
        public int NewVehicleId { get; set; }
        public string NewVehicleInfo { get; set; }
        public string ReplacementType { get; set; }
        public string Reason { get; set; }
        public string LockToken { get; set; }
        public string LockKey { get; set; }
        public DateTime? LockExpiresAt { get; set; }
    }
}
