namespace PublicCarRental.Application.DTOs.Message
{
    public class ReceiptGenerationEvent
    {
        public int InvoiceId { get; set; }
        public int ContractId { get; set; }
        public int RenterId { get; set; }
    }
}
