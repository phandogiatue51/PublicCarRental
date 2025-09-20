namespace PublicCarRental.DTOs
{
    public class InvoiceCreateDto
    {
        public int ContractId { get; set; }
        public decimal AmountDue { get; set; }
    }
}
