namespace PublicCarRental.Application.DTOs.Accident
{
    public class BulkReplacementResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public List<ContractReplacementResult> Results { get; set; } = new();
    }
}
