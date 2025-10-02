namespace PublicCarRental.Models
{
    public class VNPayConfig
    {
        public string Url { get; set; } = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        public string Api { get; set; } = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
        public string TmnCode { get; set; }
        public string HashSecret { get; set; }
        public string ReturnUrl { get; set; }
        public string Version { get; set; } = "2.1.0";
        public string Command { get; set; } = "pay";
        public string CurrCode { get; set; } = "VND";
        public string Locale { get; set; } = "vn";
    }
}
