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

                // Log ALL headers for debugging
                foreach (var header in HttpContext.Request.Headers)
                {
                    _logger.LogInformation($"📋 Header: {header.Key} = {header.Value}");
                }

                using var reader = new StreamReader(HttpContext.Request.Body);
                webhookBody = await reader.ReadToEndAsync();

                _logger.LogInformation($"📦 Webhook body length: {webhookBody?.Length ?? 0}");
                _logger.LogInformation($"📦 Webhook body: '{webhookBody}'");

                var signature = HttpContext.Request.Headers["x-payos-signature"].FirstOrDefault();
                _logger.LogInformation($"🔐 Signature from header: '{signature}'");

                // Handle PayOS test requests (empty body + no signature)
                if (string.IsNullOrEmpty(webhookBody) && string.IsNullOrEmpty(signature))
                {
                    _logger.LogInformation("🔄 PayOS test webhook detected - empty body, no signature");
                    return Ok(new
                    {
                        success = true,
                        message = "Webhook test successful - PayOS test request handled",
                        timestamp = DateTime.UtcNow
                    });
                }

                // For actual webhooks, verify signature
                if (!string.IsNullOrEmpty(signature))
                {
                    var isValid = _payOSService.VerifyWebhook(webhookBody, signature);
                    if (!isValid)
                    {
                        _logger.LogWarning("❌ Invalid webhook signature");
                        return BadRequest(new { error = "Invalid signature" });
                    }
                    _logger.LogInformation("✅ Webhook signature valid");
                }
                else
                {
                    _logger.LogWarning("⚠️ No signature provided for non-empty webhook");
                    return BadRequest(new { error = "Signature required" });
                }

                // Process actual webhook data (non-empty body)
                if (!string.IsNullOrEmpty(webhookBody))
                {
                    var webhookData = JsonSerializer.Deserialize<JsonElement>(webhookBody);

                    if (webhookData.TryGetProperty("data", out var dataElement) &&
                        dataElement.TryGetProperty("orderCode", out var orderCodeElement) &&
                        dataElement.TryGetProperty("status", out var statusElement))
                    {
                        var orderCode = orderCodeElement.GetInt32();
                        var status = statusElement.GetString();

                        _logger.LogInformation($"💰 Webhook processed: Order {orderCode} - Status {status}");

                        var invoice = _invoiceService.GetInvoiceByOrderCode(orderCode);

                        if (invoice != null)
                        {
                            _logger.LogInformation($"📄 Current invoice status: {invoice.Status}");

                            if (status == "PAID")
                            {
                                var bookingToken = invoice.BookingToken;
                                var bookingRequest = await _bookingService.GetBookingRequest(bookingToken);

                                if (bookingRequest != null)
                                {
                                    var result = await _contractService.ConfirmBookingAfterPaymentAsync(invoice.InvoiceId);
                                    if (result.Success)
                                    {
                                        _logger.LogInformation($"📝 Contract {result.contractId} created successfully");

                                        var updateSuccess = _invoiceService.UpdateInvoiceStatus(invoice.InvoiceId, InvoiceStatus.Paid, invoice.AmountDue);

                                        if (updateSuccess)
                                        {
                                            await _bookingService.RemoveBookingRequest(bookingToken);
                                            _logger.LogInformation($"✅ Payment completed: Invoice {invoice.InvoiceId} paid, Contract {result.contractId} created");
                                        }
                                        else
                                        {
                                            _logger.LogError($"❌ Invoice status update failed after contract creation");
                                        }
                                    }
                                    else
                                    {
                                        _logger.LogError($"❌ Failed to create contract: {result.Message}");
                                    }
                                }
                                else
                                {
                                    _logger.LogWarning($"⚠️ No booking request found for paid invoice {invoice.InvoiceId}");
                                }
                            }
                            else if (status == "CANCELLED" || status == "EXPIRED")
                            {
                                _logger.LogInformation($"❌ Payment {status} for invoice {invoice.InvoiceId}");

                                var success = _invoiceService.UpdateInvoiceStatus(invoice.InvoiceId, InvoiceStatus.Cancelled);

                                if (success)
                                {
                                    var bookingToken = invoice.BookingToken;
                                    await _bookingService.RemoveBookingRequest(bookingToken);
                                    _logger.LogInformation($"🗑️ Invoice {invoice.InvoiceId} marked as CANCELLED and booking request cleaned up");
                                }
                            }
                        }
                        else
                        {
                            _logger.LogWarning($"⚠️ No invoice found for order code: {orderCode}");
                        }
                    }
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error processing webhook");
                return StatusCode(500, new { error = "Internal server error" });
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