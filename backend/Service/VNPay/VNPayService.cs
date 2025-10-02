using PublicCarRental.Models;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Web;

namespace PublicCarRental.Service.VNPay
{
    public class VNPayService : IVNPayService
    {
        private readonly VNPayConfig _config;

        public VNPayService(IConfiguration configuration)
        {
            _config = configuration.GetSection("VNPay").Get<VNPayConfig>();
        }

        public string CreatePaymentUrl(Invoice invoice, string ipAddress)
        {
            var amount = (long)(invoice.AmountDue * 100); // Convert to cents
            var txnRef = invoice.InvoiceId.ToString();
            var createDate = DateTime.Now.ToString("yyyyMMddHHmmss");

            var vnpay = new SortedList<string, string>
            {
                { "vnp_Version", "2.1.0" },
                { "vnp_Command", "pay" },
                { "vnp_TmnCode", _config.TmnCode },
                { "vnp_Amount", amount.ToString() },
                { "vnp_CreateDate", createDate },
                { "vnp_CurrCode", "VND" },
                { "vnp_IpAddr", ipAddress },
                { "vnp_Locale", "vn" },
                { "vnp_OrderInfo", $"Thanh toan don hang {txnRef}" },
                { "vnp_OrderType", "other" },
                { "vnp_ReturnUrl", _config.ReturnUrl },
                { "vnp_TxnRef", txnRef },
                { "vnp_ExpireDate", DateTime.Now.AddMinutes(15).ToString("yyyyMMddHHmmss") }
            };

            var queryString = BuildQueryString(vnpay);
            var secureHash = CreateSecureHash(queryString);

            return $"{_config.Url}?{queryString}&vnp_SecureHash={secureHash}";
        }

        public bool VerifyPayment(VNPayReturnModel model)
        {
            var vnpay = new SortedList<string, string>();

            // Add all parameters except vnp_SecureHash and vnp_SecureHashType
            var properties = typeof(VNPayReturnModel).GetProperties();
            foreach (var property in properties)
            {
                var value = property.GetValue(model)?.ToString();
                if (!string.IsNullOrEmpty(value) &&
                    property.Name != "vnp_SecureHash" &&
                    property.Name != "vnp_SecureHashType")
                {
                    vnpay.Add(property.Name, value);
                }
            }

            var queryString = BuildQueryString(vnpay);
            var secureHash = CreateSecureHash(queryString);

            return secureHash == model.vnp_SecureHash &&
                   model.vnp_ResponseCode == "00" &&
                   model.vnp_TransactionStatus == "00";
        }

        private string BuildQueryString(SortedList<string, string> parameters)
        {
            var builder = new StringBuilder();
            foreach (var param in parameters)
            {
                if (!string.IsNullOrEmpty(param.Value))
                {
                    builder.Append($"{HttpUtility.UrlEncode(param.Key)}={HttpUtility.UrlEncode(param.Value)}&");
                }
            }
            // Remove last '&'
            return builder.ToString().TrimEnd('&');
        }

        private string CreateSecureHash(string input)
        {
            using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(_config.HashSecret));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(input));
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}