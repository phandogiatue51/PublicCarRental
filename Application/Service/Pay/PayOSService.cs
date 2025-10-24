using Net.payOS;
using Net.payOS.Types;
using PublicCarRental.Application.Service.Cont;
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
        private readonly IContractService _contractService;

        public PayOSService(IConfiguration configuration, IInvoiceService invoiceService, IEVRenterService renterService,
            IBookingService bookingService, ILogger<PayOSService> logger, IContractService contractService)
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
            _contractService = contractService;
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
                {
                    if (!invoice.ContractId.HasValue)
                        throw new InvalidOperationException("Invoice is not associated with a valid booking or contract");

                    var contract = _contractService.GetEntityById(invoice.ContractId.Value);
                    if (contract == null)
                        throw new InvalidOperationException("Associated contract not found");

                    _logger.LogInformation($"Processing payment for additional invoice {invoiceId} for contract {contract.ContractId}");
                }
                else
                {
                    var bookingRequest = await _bookingService.GetBookingRequest(invoice.BookingToken);
                    if (bookingRequest == null)
                        throw new InvalidOperationException("Booking request not found or expired");

                    if (bookingRequest.EVRenterId != renterId)
                        throw new UnauthorizedAccessException("Invoice does not belong to this renter");
                }

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
                    name: "Car Rental Additional Charge",
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
                _logger.LogInformation("🔐 Webhook verification started");

                if (string.IsNullOrEmpty(signature))
                {
                    _logger.LogWarning("❌ Webhook signature is missing");
                    return false;
                }

                var checksumKey = _configuration["PayOS:ChecksumKey"];
                if (string.IsNullOrEmpty(checksumKey))
                {
                    _logger.LogError("❌ ChecksumKey is not configured");
                    return false;
                }

                // Remove the signature field from the JSON before hashing
                string dataToHash;
                if (!string.IsNullOrEmpty(webhookBody))
                {
                    try
                    {
                        var jsonDoc = JsonDocument.Parse(webhookBody);
                        var root = jsonDoc.RootElement;

                        // Create a new JSON without the signature field
                        using var stream = new MemoryStream();
                        using var writer = new Utf8JsonWriter(stream);

                        writer.WriteStartObject();

                        foreach (var property in root.EnumerateObject())
                        {
                            if (property.Name != "signature")
                            {
                                property.WriteTo(writer);
                            }
                        }

                        writer.WriteEndObject();
                        writer.Flush();

                        dataToHash = Encoding.UTF8.GetString(stream.ToArray());
                        _logger.LogInformation($"📝 Data to hash (without signature): {dataToHash}");
                    }
                    catch (JsonException)
                    {
                        dataToHash = webhookBody;
                        _logger.LogWarning("⚠️ Could not parse JSON, using original body for signature");
                    }
                }
                else
                {
                    dataToHash = "";
                }

                using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(checksumKey));
                byte[] hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(dataToHash));

                var computedSignature = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
                var receivedSignature = signature.ToLower();

                _logger.LogInformation($"🔍 Computed: {computedSignature}");
                _logger.LogInformation($"🔍 Received: {receivedSignature}");

                var isValid = computedSignature == receivedSignature;

                _logger.LogInformation(isValid ? "✅ Signature verification PASSED" : "❌ Signature verification FAILED");

                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error verifying webhook signature");
                return false;
            }
        }
    }
}