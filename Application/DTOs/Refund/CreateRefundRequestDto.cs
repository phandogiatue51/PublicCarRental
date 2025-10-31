namespace PublicCarRental.Application.DTOs.Refund
{
    public class CreateRefundRequestDto
    {
        public int ContractId { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; }
        public int StaffId { get; set; }
        public string? Note { get; set; }
    }
}
