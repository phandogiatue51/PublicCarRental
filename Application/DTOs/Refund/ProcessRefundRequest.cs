using PublicCarRental.Application.DTOs.Pay;

namespace PublicCarRental.Application.DTOs.Refund
{
    public class ProcessRefundRequest
    {
        public BankAccountInfo BankInfo { get; set; }
        public bool? FullRefund { get; set; }
    }
}
