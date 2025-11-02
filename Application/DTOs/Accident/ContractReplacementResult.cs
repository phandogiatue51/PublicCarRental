namespace PublicCarRental.Application.DTOs.Accident
{
    public class ContractReplacementResult
    {
        public bool Success { get; set; }
        public int ContractId { get; set; }
        public int? NewVehicleId { get; set; }
        public string Reason { get; set; }
        public string Message { get; set; }
    }
}
