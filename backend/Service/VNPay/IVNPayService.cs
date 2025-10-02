using PublicCarRental.Models;

namespace PublicCarRental.Service.VNPay
{
    public interface IVNPayService
    {
        string CreatePaymentUrl(Invoice invoice, string ipAddress);
        bool VerifyPayment(VNPayReturnModel model);
    }
}
