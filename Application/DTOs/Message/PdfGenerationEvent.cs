namespace PublicCarRental.Application.DTOs.Message
{
    public class PdfGenerationEvent
    {
        public int ContractId { get; set; }
        public string RenterEmail { get; set; }
        public string RenterName { get; set; }
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    }
}
