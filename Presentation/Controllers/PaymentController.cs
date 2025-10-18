using CloudinaryDotNet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Pay;
using PublicCarRental.Application.Service.PDF;
using PublicCarRental.Infrastructure.Data.Models;
using System.Text.Json;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPayOSService _payOSService;
        private readonly ILogger<PaymentController> _logger;
        private readonly IInvoiceService _invoiceService;
        private readonly IContractService _contractService;
        private readonly IBookingService _bookingService;

        public PaymentController(
            IPayOSService payOSService, 
            ILogger<PaymentController> logger, IContractService contractService,
            IInvoiceService invoiceService, IBookingService bookingService)
        {
            _payOSService = payOSService;
            _logger = logger;
            _invoiceService = invoiceService;
            _contractService = contractService;
            _bookingService = bookingService;
        }

        [HttpPost("create-payment")]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request)
        {
            try
            {
                if (request.InvoiceId <= 0 || request.RenterId <= 0)
                    return BadRequest(new { error = "Invalid parameters" });

                var paymentLink = await _payOSService.CreatePaymentLink(request.InvoiceId, request.RenterId);
                return Ok(paymentLink);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook()
        {
            string webhookBody = null;
            try
            {
                _logger.LogInformation("🎯 === WEBHOOK RECEIVED ===");

                using var reader = new StreamReader(HttpContext.Request.Body);
                webhookBody = await reader.ReadToEndAsync();

                _logger.LogInformation($"📦 Webhook body: {webhookBody}");

                try
                {
                    var webhookData = JsonSerializer.Deserialize<JsonElement>(webhookBody);

                    // Extract orderCode from data
                    int orderCode = 0;
                    string status = null;

                    if (webhookData.TryGetProperty("data", out var dataElement) &&
                        dataElement.TryGetProperty("orderCode", out var orderCodeElement))
                    {
                        orderCode = orderCodeElement.GetInt32();
                        _logger.LogInformation($"🔍 Found orderCode: {orderCode}");
                    }

                    // Determine status from root-level code
                    if (webhookData.TryGetProperty("code", out var codeElement))
                    {
                        var code = codeElement.GetString();
                        status = code == "00" ? "PAID" : "UNKNOWN";
                        _logger.LogInformation($"🔍 Root code: {code} -> Status: {status}");
                    }

                    if (webhookData.TryGetProperty("success", out var successElement) &&
                        successElement.GetBoolean())
                    {
                        status = "PAID";
                        _logger.LogInformation($"🔍 Success is true -> Status: {status}");
                    }

                    if (orderCode > 0 && !string.IsNullOrEmpty(status) && status == "PAID")
                    {
                        _logger.LogInformation($"💰 PROCESSING: Order {orderCode} - Status {status}");

                        var invoice = _invoiceService.GetInvoiceByOrderCode(orderCode);
                        _logger.LogInformation($"📄 Invoice lookup result: {(invoice != null ? $"Found invoice {invoice.InvoiceId}" : "NOT FOUND")}");

                        if (invoice != null && invoice.Status != InvoiceStatus.Paid)
                        {
                            _logger.LogInformation($"📄 Invoice {invoice.InvoiceId} current status: {invoice.Status}");

                            // STEP 1: Update invoice status to PAID FIRST
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
                        else
                        {
                            _logger.LogInformation($"ℹ️ No action needed - Invoice already processed or not found");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"❌ Invalid orderCode or status. OrderCode: {orderCode}, Status: {status}");
                    }
                }
                catch (JsonException jsonEx)
                {
                    _logger.LogError(jsonEx, "❌ Failed to parse webhook JSON");
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error processing webhook");
                return Ok(new { success = true });
            }
        }

        [HttpGet("status/{orderCode}")]
        public async Task<IActionResult> GetPaymentStatus(int orderCode)
        {
            try
            {
                if (orderCode <= 0)
                    return BadRequest(new { error = "Invalid order code" });

                var status = await _payOSService.GetPaymentStatus(orderCode);
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment status");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("check-and-update/{orderCode}")]
        public async Task<IActionResult> CheckAndUpdatePayment(int orderCode)
        {
            try
            {
                if (orderCode <= 0)
                    return BadRequest(new { error = "Invalid order code" });

                _logger.LogInformation($"Checking payment status for order code: {orderCode}");

                var paymentStatus = await _payOSService.GetPaymentStatus(orderCode);
                _logger.LogInformation($"PayOS payment status: {paymentStatus.status}");

                var invoice = _invoiceService.GetInvoiceByOrderCode(orderCode);
                if (invoice == null)
                {
                    return NotFound(new { error = $"No invoice found for order code: {orderCode}" });
                }

                _logger.LogInformation($"Found invoice {invoice.InvoiceId} with current status: {invoice.Status}");

                if (paymentStatus.status == "PAID" && invoice.Status != InvoiceStatus.Paid)
                {
                    _logger.LogInformation($"Payment is PAID, updating invoice {invoice.InvoiceId} to PAID status");

                    var success = _invoiceService.UpdateInvoiceStatus(
                        invoice.InvoiceId,
                        InvoiceStatus.Paid,
                        invoice.AmountDue
                    );

                    if (success)
                    {
                        var updatedInvoice = _invoiceService.GetEntityById(invoice.InvoiceId);
                        return Ok(new
                        {
                            success = true,
                            message = "Payment confirmed and invoice updated to PAID",
                            paymentStatus = paymentStatus.status,
                            invoiceId = invoice.InvoiceId,
                            oldStatus = invoice.Status,
                            newStatus = updatedInvoice?.Status,
                            contractStatus = updatedInvoice?.Contract?.Status
                        });
                    }
                    else
                    {
                        return StatusCode(500, new { error = "Payment confirmed but failed to update invoice" });
                    }
                }
                else if (paymentStatus.status == "CANCELLED" || paymentStatus.status == "EXPIRED")
                {
                    _logger.LogInformation($"Payment is {paymentStatus.status}, updating invoice {invoice.InvoiceId} to UNPAID status");

                    var success = _invoiceService.UpdateInvoiceStatus(
                        invoice.InvoiceId,
                        InvoiceStatus.Cancelled
                    );

                    if (success)
                    {
                        var updatedInvoice = _invoiceService.GetEntityById(invoice.InvoiceId);
                        return Ok(new
                        {
                            success = true,
                            message = $"Payment {paymentStatus.status.ToLower()} and invoice updated to CANCELLED",
                            paymentStatus = paymentStatus.status,
                            invoiceId = invoice.InvoiceId,
                            oldStatus = invoice.Status,
                            newStatus = updatedInvoice?.Status,
                            contractStatus = updatedInvoice?.Contract?.Status
                        });
                    }
                    else
                    {
                        return StatusCode(500, new { error = $"Payment {paymentStatus.status.ToLower()} but failed to update invoice" });
                    }
                }
                else
                {
                    // Handle other payment statuses (PENDING, etc.)
                    _logger.LogInformation($"Payment status is {paymentStatus.status}, no action required");
                    return Ok(new
                    {
                        success = true,
                        message = $"Payment status is {paymentStatus.status}, no update required",
                        paymentStatus = paymentStatus.status,
                        invoiceId = invoice.InvoiceId,
                        currentStatus = invoice.Status
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking and updating payment");
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [AllowAnonymous]
        [HttpGet("success")]
        public IActionResult PaymentSuccess([FromQuery] string orderCode)
        {
            var frontendUrl = $"https://sweet-essence-production.up.railway.app/payment/success?orderCode={orderCode}";
            return Redirect(frontendUrl);
        }

        [AllowAnonymous]
        [HttpGet("cancel")]
        public IActionResult PaymentCancel()
        {
            var frontendUrl = "https://sweet-essence-production.up.railway.app/payment/cancel";
            return Redirect(frontendUrl);
        }
    }

    public class CreatePaymentRequest
    {
        public int InvoiceId { get; set; }
        public int RenterId { get; set; }
    }
}