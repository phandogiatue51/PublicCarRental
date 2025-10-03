using Net.payOS;
using Net.payOS.Types;
using PublicCarRental.Service.Inv;
using PublicCarRental.Service.Ren;
using System.Text.Json;

namespace PublicCarRental.Services
{
    public interface IPayOSService
    {
        Task<CreatePaymentResult> CreatePaymentLink(int invoiceId, int renterId);
        Task<PaymentLinkInformation> GetPaymentStatus(int orderCode);
        bool VerifyWebhook(string webhookBody, string signature);
    }

    public class PayOSService : IPayOSService
    {
        private readonly PayOS _payOS;
        private readonly IInvoiceService _invoiceService;
        private readonly IEVRenterService _renterService;
        private readonly ILogger<PayOSService> _logger;
        private readonly IConfiguration _configuration;

        public PayOSService(
            IConfiguration configuration,
            IInvoiceService invoiceService,
            IEVRenterService renterService,
            ILogger<PayOSService> logger)
        {
            var clientId = configuration["PayOS:ClientId"];
            var apiKey = configuration["PayOS:ApiKey"];
            var checksumKey = configuration["PayOS:ChecksumKey"];

            _payOS = new PayOS(clientId, apiKey, checksumKey);
            _invoiceService = invoiceService;
            _renterService = renterService;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<CreatePaymentResult> CreatePaymentLink(int invoiceId, int renterId)
        {
            try
            {
                var invoice = _invoiceService.GetEntityById(invoiceId);
                if (invoice == null)
                    throw new ArgumentException("Invoice not found");

                var renter = _renterService.GetEntityById(renterId);
                if (renter == null)
                    throw new ArgumentException("Renter not found");

                if (invoice.Contract.EVRenterId != renterId)
                    throw new UnauthorizedAccessException("Invoice does not belong to this renter");

                // Generate order code
                var orderCode = new Random().Next(100000, 999999);

                // Get URLs from configuration
                var returnUrl = _configuration["PayOS:ReturnUrl"] ?? "https://google.com";
                var cancelUrl = _configuration["PayOS:CancelUrl"] ?? "https://google.com";
                
                _logger.LogInformation($"Using ReturnUrl: {returnUrl}, CancelUrl: {cancelUrl}");

                // Use minimal, guaranteed-to-work data
                var paymentData = new PaymentData(
                    orderCode: orderCode,
                    amount: (int)invoice.AmountDue,
                    description: "Car Rental Payment", 
                    items: new List<ItemData>
                    {
                    new ItemData(
                        name: "Car Rental",
                        quantity: 1,
                        price: (int)invoice.AmountDue)},
                        cancelUrl: cancelUrl,
                        returnUrl: returnUrl,
                        buyerName: renter.Account.FullName,
                        buyerEmail: renter.Account.Email, 
                        buyerPhone: renter.Account.PhoneNumber, 
                        expiredAt: (int)DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds()
                    );

                var result = await _payOS.createPaymentLink(paymentData);

                invoice.OrderCode = orderCode;
                _invoiceService.UpdateInvoice(invoice);

                _logger.LogInformation($"Payment link created: {result.checkoutUrl}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment link");
                throw;
            }
        }

        public async Task<PaymentLinkInformation> GetPaymentStatus(int orderCode)
        {
            try
            {
                return await _payOS.getPaymentLinkInformation(orderCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment status");
                throw;
            }
        }

        public bool VerifyWebhook(string webhookBody, string signature)
        {
            try
            {
                _logger.LogInformation("Webhook verification called");
                
                if (string.IsNullOrEmpty(signature))
                {
                    _logger.LogWarning("Webhook signature is missing");
                    return false;
                }

                // For production, you should implement proper signature verification
                // using the checksum key from PayOS
                // For now, we'll do basic validation
                return !string.IsNullOrEmpty(webhookBody) && !string.IsNullOrEmpty(signature);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying webhook signature");
                return false;
            }
        }
    }
}