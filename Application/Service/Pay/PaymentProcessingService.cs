using PublicCarRental.Application.DTOs.Pay;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
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
        private readonly IContractRepository _contractRepository;
        private readonly IPendingChangeService _pendingChangeService;

        public PaymentProcessingService(IInvoiceService invoiceService, IContractService contractService,
            IBookingService bookingService, ILogger<PaymentProcessingService> logger,
            IContractRepository contractRepository, IPendingChangeService pendingChangeService)
        {
            _invoiceService = invoiceService;
            _contractService = contractService;
            _bookingService = bookingService;
            _logger = logger;
            _contractRepository = contractRepository;
            _pendingChangeService = pendingChangeService;
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

            if (invoice.Status != InvoiceStatus.Paid)
            {
                _logger.LogInformation("🔄 STEP 1: Updating invoice status to PAID...");
                var invoiceUpdateSuccess = _invoiceService.UpdateInvoiceStatus(invoice.InvoiceId, InvoiceStatus.Paid, invoice.AmountDue);

                if (!invoiceUpdateSuccess)
                {
                    _logger.LogError($"❌ Failed to update invoice {invoiceId} status to PAID");
                    return;
                }
                _logger.LogInformation("✅ Invoice status updated to PAID");
            }

            var pendingChange = await _pendingChangeService.GetByInvoiceIdAsync(invoiceId);

            if (pendingChange != null)
            {
                await CompleteModificationAfterPaymentAsync(pendingChange);
                _logger.LogInformation($"✅ Modification completed for invoice {invoiceId}");
            }
            else
            {
                var bookingToken = invoice.BookingToken;
                var bookingRequest = await _bookingService.GetBookingRequest(bookingToken);
                if (bookingRequest != null)
                {
                    _logger.LogInformation("🚀 Calling ConfirmBookingAfterPaymentAsync...");
                    var result = await _contractService.ConfirmBookingAfterPaymentAsync(invoice.InvoiceId);
                    _logger.LogInformation($"📝 Contract creation result: Success={result.Success}, ContractId={result.contractId}");

                    if (result.Success)
                    {
                        await _bookingService.RemoveBookingRequest(bookingToken);
                        _logger.LogInformation($"✅ Payment completed: Invoice {invoice.InvoiceId} paid, Contract {result.contractId} created");
                    }
                }
                else
                {
                    _logger.LogWarning($"⚠️ No booking request found for invoice {invoiceId}");
                }
            }
        }

        private async Task CompleteModificationAfterPaymentAsync(PendingModificationDto pendingChange)
        {
            var contract = _contractRepository.GetById(pendingChange.ContractId);

            if (pendingChange.ChangeType == "ModelChange")
            {
                contract.VehicleId = pendingChange.NewVehicleId;
                contract.TotalCost = pendingChange.NewTotalCost;
                _logger.LogInformation($"🔄 Updated contract {pendingChange.ContractId}: Model change applied");
            }
            else if (pendingChange.ChangeType == "TimeExtension")
            {
                contract.EndTime = (DateTime)pendingChange.NewEndTime;
                contract.TotalCost = pendingChange.NewTotalCost;
                _logger.LogInformation($"🔄 Updated contract {pendingChange.ContractId}: Time extension applied");
            }

            _contractRepository.Update(contract);

            await _pendingChangeService.RemoveAsync(pendingChange.InvoiceId);
            _logger.LogInformation($"🗑️ Removed pending modification for invoice {pendingChange.InvoiceId}");
        }
    }
}