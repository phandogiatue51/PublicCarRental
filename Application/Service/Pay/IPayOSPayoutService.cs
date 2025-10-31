using PublicCarRental.Application.DTOs.Pay;

namespace PublicCarRental.Application.Service.Pay
{
    public interface IPayOSPayoutService
    {
        Task<PayoutResult> CreateSinglePayoutAsync(int refundId, BankAccountInfo bankInfo, decimal refundAmount);
        Task<PayoutInfo> GetPayoutStatusAsync(string payoutId);
        Task<decimal> GetAccountBalanceAsync();
    }
}
