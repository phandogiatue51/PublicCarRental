using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Infrastructure.Data.Models;
using System.Text.Json;

namespace PublicCarRental.Application.Service.Pay
{
    public interface IPaymentProcessingService
    {
        Task ProcessPaymentWebhookAsync(string webhookBody);
        Task HandlePaidPaymentAsync(int invoiceId);
        Task HandleCancelledPaymentAsync(int invoiceId);
    }

    public class PaymentProcessingService : IPaymentProcessingService
    {
        private readonly IInvoiceService _invoiceService;
        private readonly IContractService _contractService;
        private readonly IBookingService _bookingService;
        private readonly IDistributedLockService _distributedLock;
        private readonly ILogger<PaymentProcessingService> _logger;

        public PaymentProcessingService(
            IInvoiceService invoiceService,
            IContractService contractService,
            IBookingService bookingService,
            IDistributedLockService distributedLock,
            ILogger<PaymentProcessingService> logger)
        {
            _invoiceService = invoiceService;
            _contractService = contractService;
            _bookingService = bookingService;
            _distributedLock = distributedLock;
            _logger = logger;
        }

        public async Task ProcessPaymentWebhookAsync(string webhookBody)
        {
            try
            {
                var webhookData = JsonSerializer.Deserialize<JsonElement>(webhookBody);

                // Extract orderCode from data
                int orderCode = 0;
                string status = "UNKNOWN";

                if (webhookData.TryGetProperty("data", out var dataElement) &&
                    dataElement.TryGetProperty("orderCode", out var orderCodeElement))
                {
                    orderCode = orderCodeElement.GetInt32();
                    _logger.LogInformation($"🔍 Found orderCode: {orderCode}");
                }

                // Determine status from multiple possible fields
                if (webhookData.TryGetProperty("code", out var codeElement))
                {
                    var code = codeElement.GetString();
                    status = code == "00" ? "PAID" : GetStatusFromCode(code);
                    _logger.LogInformation($"🔍 Root code: {code} -> Status: {status}");
                }
                else if (webhookData.TryGetProperty("success", out var successElement) &&
                         successElement.GetBoolean())
                {
                    status = "PAID";
                    _logger.LogInformation($"🔍 Success is true -> Status: {status}");
                }
                else if (webhookData.TryGetProperty("status", out var statusElement))
                {
                    status = statusElement.GetString()?.ToUpper() ?? "UNKNOWN";
                    _logger.LogInformation($"🔍 Status field: {status}");
                }

                _logger.LogInformation($"💰 PROCESSING: Order {orderCode} - Status {status}");

                if (orderCode > 0)
                {
                    var invoice = _invoiceService.GetInvoiceByOrderCode(orderCode);
                    _logger.LogInformation($"📄 Invoice lookup result: {(invoice != null ? $"Found invoice {invoice.InvoiceId}" : "NOT FOUND")}");

                    if (invoice != null)
                    {
                        switch (status)
                        {
                            case "PAID":
                                await HandlePaidPaymentAsync(invoice.InvoiceId);
                                break;
                            case "CANCELLED":
                            case "EXPIRED":
                            case "FAILED":
                                await HandleCancelledPaymentAsync(invoice.InvoiceId);
                                break;
                            default:
                                _logger.LogWarning($"❓ Unknown status: {status} for order {orderCode}");
                                break;
                        }
                    }
                }
                else
                {
                    _logger.LogWarning($"❌ Invalid orderCode: {orderCode}");
                }
            }
            catch (JsonException jsonEx)
            {
                _logger.LogError(jsonEx, "❌ Failed to parse webhook JSON");
                throw;
            }
        }

        public async Task HandlePaidPaymentAsync(int invoiceId)
        {
            var invoice = _invoiceService.GetEntityById(invoiceId);
            if (invoice == null)
            {
                _logger.LogWarning($"Invoice {invoiceId} not found");
                return;
            }

            if (invoice.Status == InvoiceStatus.Paid)
            {
                _logger.LogInformation($"ℹ️ Invoice {invoice.InvoiceId} already paid");
                return;
            }

            _logger.LogInformation("🔄 STEP 1: Updating invoice status to PAID...");
            var invoiceUpdateSuccess = _invoiceService.UpdateInvoiceStatus(invoice.InvoiceId, InvoiceStatus.Paid, invoice.AmountDue);
            _logger.LogInformation($"📊 Invoice status update: {invoiceUpdateSuccess}");

            if (invoiceUpdateSuccess)
            {
                _logger.LogInformation("✅ Invoice status updated to PAID");

                var bookingToken = invoice.BookingToken;
                _logger.LogInformation($"🔑 Booking token: {bookingToken}");

                var bookingRequest = await _bookingService.GetBookingRequest(bookingToken);
                _logger.LogInformation($"📋 Booking request: {(bookingRequest != null ? "FOUND" : "NOT FOUND")}");

                if (bookingRequest != null)
                {
                    // STEP 2: Now create contract (invoice is already PAID)
                    _logger.LogInformation("🚀 STEP 2: Calling ConfirmBookingAfterPaymentAsync...");
                    var result = await _contractService.ConfirmBookingAfterPaymentAsync(invoice.InvoiceId);
                    _logger.LogInformation($"📝 Contract creation result: Success={result.Success}, ContractId={result.contractId}, Message={result.Message}");

                    if (result.Success)
                    {
                        // STEP 3: Clean up booking request
                        await _bookingService.RemoveBookingRequest(bookingToken);
                        _logger.LogInformation($"✅ Payment completed: Invoice {invoice.InvoiceId} paid, Contract {result.contractId} created");
                    }
                }
                else
                {
                    _logger.LogWarning($"⚠️ No booking request found, but invoice marked as PAID");
                }
            }
        }

        public async Task HandleCancelledPaymentAsync(int invoiceId)
        {
            var invoice = _invoiceService.GetEntityById(invoiceId);
            if (invoice == null)
            {
                _logger.LogWarning($"Invoice {invoiceId} not found");
                return;
            }

            _logger.LogInformation($"🔄 Handling CANCELLED payment for invoice {invoice.InvoiceId}");

            var updateSuccess = _invoiceService.UpdateInvoiceStatus(invoice.InvoiceId, InvoiceStatus.Cancelled, 0);

            if (updateSuccess)
            {
                _logger.LogInformation($"✅ Invoice {invoice.InvoiceId} marked as CANCELLED");

                if (!string.IsNullOrEmpty(invoice.BookingToken))
                {
                    await _bookingService.RemoveBookingRequest(invoice.BookingToken);
                    _logger.LogInformation($"✅ Booking request cleaned up for token: {invoice.BookingToken}");
                }

                var bookingRequest = await _bookingService.GetBookingRequest(invoice.BookingToken);
                if (bookingRequest != null)
                {
                    var lockKey = $"vehicle_booking:{bookingRequest.VehicleId}:{bookingRequest.StartTime:yyyyMMddHHmm}_{bookingRequest.EndTime:yyyyMMddHHmm}";
                    _distributedLock.ReleaseLock(lockKey, invoice.BookingToken); 
                    _logger.LogInformation($"✅ Vehicle lock released: {lockKey}");
                }
            }
        }

        private string GetStatusFromCode(string code)
        {
            return code switch
            {
                "01" or "02" or "03" => "CANCELLED",
                "04" or "05" => "EXPIRED",
                "06" or "07" => "FAILED",
                _ => "UNKNOWN"
            };
        }
    }
}
