using System.Text;
using System.Security.Cryptography;
using Newtonsoft.Json;
using PublicCarRental.Service.Inv;
using PublicCarRental.Service.Acc;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Pay
{
    public class PaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly IAccountService _accountService;
        private readonly IInvoiceService _invoiceService;
        private readonly HttpClient _httpClient;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(
            IConfiguration configuration,
            IAccountService accountService,
            IInvoiceService invoiceService,
            IHttpClientFactory httpClientFactory,
            ILogger<PaymentService> logger)
        {
            _configuration = configuration;
            _accountService = accountService;
            _invoiceService = invoiceService;
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;
        }

        public async Task<dynamic> CreatePaymentAsync(int invoiceId, int renterId)
        {
            var invoice = _invoiceService.GetEntityById(invoiceId);
            if (invoice == null)
                throw new ArgumentException("Invoice not found");

            var renter = _accountService.GetAccountById(renterId);
            if (renter == null)
                throw new ArgumentException("Renter not found");

            if (invoice.Contract.EVRenterId != renterId)
                throw new UnauthorizedAccessException("Invoice does not belong to this renter");

            // Generate unique order code
            var orderCode = (int)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds % 1000000000;

            var paymentData = new
            {
                orderCode = orderCode,
                amount = (int)invoice.AmountDue,
                description = $"Payment for rental contract #{invoice.ContractId}",
                cancelUrl = _configuration["PayOS:CancelUrl"],
                returnUrl = _configuration["PayOS:ReturnUrl"],
                buyerName = renter.FullName,
                buyerEmail = renter.Email,
                buyerPhone = renter.PhoneNumber,
                items = new[]
                {
            new
            {
                name = $"Car Rental - Contract #{invoice.ContractId}",
                quantity = 1,
                price = (int)invoice.AmountDue
            }
        },
                expiredAt = (int)DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds()
            };

            var json = JsonConvert.SerializeObject(paymentData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Add authentication
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("x-client-id", _configuration["PayOS:ClientId"]);
            _httpClient.DefaultRequestHeaders.Add("x-api-key", _configuration["PayOS:ApiKey"]);

            var response = await _httpClient.PostAsync("https://api-merchant.payos.vn/v2/payment-requests", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"PayOS API error: {error}");
            }

            var result = await response.Content.ReadAsStringAsync();
            var paymentResponse = JsonConvert.DeserializeObject<dynamic>(result);

            // Store OrderCode in invoice
            invoice.OrderCode = orderCode;
            _invoiceService.UpdateInvoice(invoice); 

            return paymentResponse;
        }

        public async Task<bool> HandleWebhook(dynamic webhookData)
        {
            try
            {
                // Verify webhook signature if needed
                string webhookSignature = webhookData.signature;
                string data = $"{webhookData.code}|{webhookData.data.orderCode}|{webhookData.data.amount}";

                var expectedSignature = GenerateSignature(data);
                if (webhookSignature != expectedSignature) return false;

                // Update invoice status based on webhook
                int orderCode = webhookData.data.orderCode;
                string status = webhookData.data.status;

      
                 var invoice = _invoiceService.GetInvoiceByOrderCode(orderCode);
                if (invoice != null)
                {
                    invoice.Status = status == "PAID" ? InvoiceStatus.Paid : InvoiceStatus.Unpaid;
                    _invoiceService.UpdateInvoice(invoice);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling webhook");
                return false;
            }
        }

        private string GenerateSignature(string data)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_configuration["PayOS:ChecksumKey"]));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }

        public async Task<dynamic> GetPaymentStatusAsync(int orderCode)
        {
            try
            {
                _logger.LogInformation($"Getting payment status for order code: {orderCode}");

                // Add authentication headers
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("x-client-id", _configuration["PayOS:ClientId"]);
                _httpClient.DefaultRequestHeaders.Add("x-api-key", _configuration["PayOS:ApiKey"]);

                // Call PayOS API to get payment status
                var response = await _httpClient.GetAsync($"https://api-merchant.payos.vn/v2/payment-requests/{orderCode}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"PayOS API error for order {orderCode}: {errorContent}");

                    // Handle specific HTTP status codes
                    if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    {
                        throw new Exception($"Payment with order code {orderCode} not found");
                    }

                    throw new Exception($"Failed to get payment status: {errorContent}");
                }

                var result = await response.Content.ReadAsStringAsync();
                var paymentStatus = JsonConvert.DeserializeObject<dynamic>(result);

                _logger.LogInformation($"Payment status for order {orderCode}: {paymentStatus?.status}");

                return paymentStatus;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, $"Network error while getting payment status for order {orderCode}");
                throw new Exception("Network error occurred while checking payment status");
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, $"JSON parsing error for order {orderCode}");
                throw new Exception("Error parsing payment status response");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error getting payment status for order {orderCode}");
                throw;
            }
        }
    }
}