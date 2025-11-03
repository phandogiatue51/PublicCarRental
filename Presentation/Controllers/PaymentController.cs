using CloudinaryDotNet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Pay;
using PublicCarRental.Application.Service.PDF;
using PublicCarRental.Application.Service.Redis;
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
        private readonly IDistributedLockService _distributedLock;
        private readonly IPaymentProcessingService _paymentProcessingService;

        public PaymentController(IPayOSService payOSService, IDistributedLockService distributedLockService,
            ILogger<PaymentController> logger, IContractService contractService,
            IInvoiceService invoiceService, IBookingService bookingService, IPaymentProcessingService paymentProcessingService)
        {
            _payOSService = payOSService;
            _logger = logger;
            _invoiceService = invoiceService;
            _contractService = contractService;
            _bookingService = bookingService;
            _distributedLock = distributedLockService;
            _paymentProcessingService = paymentProcessingService;
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

                await _paymentProcessingService.ProcessPaymentWebhookAsync(webhookBody);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Error processing webhook");
                return Ok(new { success = true }); // Always return 200 to payment provider
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
            var frontendUrl = $"https://car777.shop/payment/success?orderCode={orderCode}";
            return Redirect(frontendUrl);
        }

        [AllowAnonymous]
        [HttpGet("cancel")]
        public IActionResult PaymentCancel()
        {
            var frontendUrl = "https://car777.shop/payment/cancel";
            return Redirect(frontendUrl);
        }
    }

    public class CreatePaymentRequest
    {
        public int InvoiceId { get; set; }
        public int RenterId { get; set; }
    }
}