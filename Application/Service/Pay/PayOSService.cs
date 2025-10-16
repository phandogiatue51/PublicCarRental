using Net.payOS;
using Net.payOS.Types;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Ren;
using System.Text;
using System.Text.Json;

namespace PublicCarRental.Application.Service.Pay
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
        private readonly IBookingService _bookingService; 
        private readonly ILogger<PayOSService> _logger;
        private readonly IConfiguration _configuration;

        public PayOSService(IConfiguration configuration, IInvoiceService invoiceService, IEVRenterService renterService,
            IBookingService bookingService, ILogger<PayOSService> logger)
        {
            var clientId = configuration["PayOS:ClientId"];
            var apiKey = configuration["PayOS:ApiKey"];
            var checksumKey = configuration["PayOS:ChecksumKey"];

            _payOS = new PayOS(clientId, apiKey, checksumKey);
            _invoiceService = invoiceService;
            _renterService = renterService;
            _bookingService = bookingService;
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

                var renter = await _renterService.GetEntityByIdAsync(renterId);
                if (renter == null)
                    throw new ArgumentException("Renter not found");

                if (string.IsNullOrEmpty(invoice.BookingToken))
                    throw new InvalidOperationException("Invoice is not associated with a valid booking");

                var bookingRequest = await _bookingService.GetBookingRequest(invoice.BookingToken);
                if (bookingRequest == null)
                    throw new InvalidOperationException("Booking request not found or expired");

                if (bookingRequest.EVRenterId != renterId)
                    throw new UnauthorizedAccessException("Invoice does not belong to this renter");

                var orderCode = new Random().Next(100000, 999999);

                var returnUrl = _configuration["PayOS:ReturnUrl"];
                var cancelUrl = _configuration["PayOS:CancelUrl"];

                _logger.LogInformation($"Using ReturnUrl: {returnUrl}, CancelUrl: {cancelUrl}");

                var paymentData = new PaymentData(
                    orderCode: orderCode,
                    amount: (int)invoice.AmountDue,
                    description: "Car Rental Payment",
                    items: new List<ItemData>
                    {
                new ItemData(
                    name: "Car Rental",
                    quantity: 1,
                    price: (int)invoice.AmountDue)
                    },
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

                var checksumKey = _configuration["PayOS:ChecksumKey"];
                if (string.IsNullOrEmpty(checksumKey))
                {
                    _logger.LogError("ChecksumKey is not configured");
                    return false;
                }

                using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(checksumKey));
                var computedSignature = BitConverter.ToString(hmac.ComputeHash(Encoding.UTF8.GetBytes(webhookBody)))
                    .Replace("-", "")
                    .ToLower();

                var isValid = computedSignature == signature.ToLower();

                if (!isValid)
                {
                    _logger.LogWarning($"Webhook signature mismatch. Computed: {computedSignature}, Received: {signature}");
                }
                else
                {
                    _logger.LogInformation("Webhook signature verified successfully");
                }

                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying webhook signature");
                return false;
            }
        }
    }
}