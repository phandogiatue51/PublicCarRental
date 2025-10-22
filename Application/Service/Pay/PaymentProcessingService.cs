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
    }

    public class PaymentProcessingService : IPaymentProcessingService
    {
        private readonly IInvoiceService _invoiceService;
        private readonly IContractService _contractService;
        private readonly IBookingService _bookingService;
        private readonly ILogger<PaymentProcessingService> _logger;

        public PaymentProcessingService(IInvoiceService invoiceService, IContractService contractService, IBookingService bookingService,
            ILogger<PaymentProcessingService> logger)
        {
            _invoiceService = invoiceService;
            _contractService = contractService;
            _bookingService = bookingService;
            _logger = logger;
        }

        public async Task ProcessPaymentWebhookAsync(string webhookBody)
        {
            try
            {
                var webhookData = JsonSerializer.Deserialize<JsonElement>(webhookBody);

                int orderCode = 0;
                bool isPaid = false;

                if (webhookData.TryGetProperty("data", out var dataElement) &&
                    dataElement.TryGetProperty("orderCode", out var orderCodeElement))
                {
                    orderCode = orderCodeElement.GetInt32();
                    _logger.LogInformation($"🔍 Found orderCode: {orderCode}");
                }

                if (webhookData.TryGetProperty("code", out var codeElement) &&
                    codeElement.GetString() == "00")
                {
                    isPaid = true;
                }
                else if (webhookData.TryGetProperty("success", out var successElement) &&
                         successElement.GetBoolean())
                {
                    isPaid = true;
                }

                if (orderCode > 0 && isPaid)
                {
                    var invoice = _invoiceService.GetInvoiceByOrderCode(orderCode);
                    if (invoice != null)
                    {
                        await HandlePaidPaymentAsync(invoice.InvoiceId);
                    }
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
                    _logger.LogInformation("🚀 STEP 2: Calling ConfirmBookingAfterPaymentAsync...");
                    var result = await _contractService.ConfirmBookingAfterPaymentAsync(invoice.InvoiceId);
                    _logger.LogInformation($"📝 Contract creation result: Success={result.Success}, ContractId={result.contractId}, Message={result.Message}");

                    if (result.Success)
                    {
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
    }
}
