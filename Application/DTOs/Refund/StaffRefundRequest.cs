using PublicCarRental.Application.DTOs.Pay;

namespace PublicCarRental.Application.DTOs.Refund
{
    public class StaffRefundRequest
    {
        public int ContractId { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; }
        public string Note { get; set; }
        public BankAccountInfo BankInfo { get; set; }
        public bool FullRefund { get; set; }
    }
}
