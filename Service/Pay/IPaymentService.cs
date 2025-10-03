namespace PublicCarRental.Service.Pay
{
    public interface IPaymentService
    {
        Task<dynamic> CreatePaymentAsync(int invoiceId, int renterId);
        Task<bool> HandleWebhook(dynamic webhookData);
        Task<dynamic> GetPaymentStatusAsync(int orderCode);
    }
}