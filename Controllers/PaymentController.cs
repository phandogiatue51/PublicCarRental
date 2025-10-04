using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Service.Inv;
using PublicCarRental.Services;
using System.Text.Json;

namespace PublicCarRental.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPayOSService _payOSService;
        private readonly ILogger<PaymentController> _logger;
        private readonly IInvoiceService _invoiceService;

        public PaymentController(
            IPayOSService payOSService,
            ILogger<PaymentController> logger,
            IInvoiceService invoiceService)
        {
            _payOSService = payOSService;
            _logger = logger;
            _invoiceService = invoiceService;
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
            try
            {
                using var reader = new StreamReader(HttpContext.Request.Body);
                var webhookBody = await reader.ReadToEndAsync();

                _logger.LogInformation($"Webhook received: {webhookBody}");

                // Get signature from header
                var signature = HttpContext.Request.Headers["x-payos-signature"].FirstOrDefault();

                // Verify webhook signature
                var isValid = _payOSService.VerifyWebhook(webhookBody, signature);
                if (!isValid)
                {
                    _logger.LogWarning("Invalid webhook signature");
                    return BadRequest(new { error = "Invalid signature" });
                }

                // Parse webhook data manually
                var webhookData = JsonSerializer.Deserialize<JsonElement>(webhookBody);

                if (webhookData.TryGetProperty("data", out var dataElement) &&
                    dataElement.TryGetProperty("orderCode", out var orderCodeElement) &&
                    dataElement.TryGetProperty("status", out var statusElement))
                {
                    var orderCode = orderCodeElement.GetInt32();
                    var status = statusElement.GetString();

                    _logger.LogInformation($"Webhook processed: Order {orderCode} - Status {status}");

                    // Update invoice based on status
                    var invoice = _invoiceService.GetInvoiceByOrderCode(orderCode);
                    _logger.LogInformation($"Invoice lookup result: {(invoice != null ? $"Found invoice {invoice.InvoiceId} with status {invoice.Status}" : "No invoice found")}");
                    
                    if (invoice != null)
                    {
                        _logger.LogInformation($"Current invoice status: {invoice.Status}, Contract status: {invoice.Contract?.Status}");
                        
                        if (status == "PAID")
                        {
                            _logger.LogInformation($"Attempting to update invoice {invoice.InvoiceId} to PAID status with amount {invoice.AmountDue}");
                            
                            // Use your service method instead of updating directly
                            var success = _invoiceService.UpdateInvoiceStatus(
                                invoice.InvoiceId,
                                Models.InvoiceStatus.Paid,
                                invoice.AmountDue
                            );

                            if (success)
                            {
                                _logger.LogInformation($"Invoice {invoice.InvoiceId} marked as PAID and contract status updated");
                                
                                // Verify the update by fetching the invoice again
                                var updatedInvoice = _invoiceService.GetEntityById(invoice.InvoiceId);
                                _logger.LogInformation($"Verification - Updated invoice status: {updatedInvoice?.Status}, Contract status: {updatedInvoice?.Contract?.Status}");
                            }
                            else
                            {
                                _logger.LogError($"Failed to update invoice status for invoice {invoice.InvoiceId}");
                            }
                        }
                        else if (status == "CANCELLED" || status == "EXPIRED")
                        {
                            _logger.LogInformation($"Webhook: Payment {status} for invoice {invoice.InvoiceId}, updating to UNPAID status");
                            
                            var success = _invoiceService.UpdateInvoiceStatus(
                                invoice.InvoiceId,
                                Models.InvoiceStatus.Cancelled
                            );
                            
                            if (success)
                            {
                                _logger.LogInformation($"Webhook: Invoice {invoice.InvoiceId} marked as UNPAID and contract updated");
                                
                                // Verify the update by fetching the invoice again
                                var updatedInvoice = _invoiceService.GetEntityById(invoice.InvoiceId);
                                _logger.LogInformation($"Webhook: Verification - Updated invoice status: {updatedInvoice?.Status}, Contract status: {updatedInvoice?.Contract?.Status}");
                            }
                            else
                            {
                                _logger.LogError($"Webhook: Failed to update invoice {invoice.InvoiceId} to UNPAID status");
                            }
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"No invoice found for order code: {orderCode}");
                        
                        // Let's also log all invoices with their order codes for debugging
                        var allInvoices = _invoiceService.GetAll();
                        _logger.LogInformation($"Available invoices with order codes: {string.Join(", ", allInvoices.Select(i => $"ID:{i.InvoiceId} OrderCode:{(i as dynamic)?.OrderCode ?? "null"}"))}");
                    }
                }
                else
                {
                    _logger.LogWarning("Webhook data missing required fields (data, orderCode, or status)");
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing webhook");
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

                if (paymentStatus.status == "PAID" && invoice.Status != Models.InvoiceStatus.Paid)
                {
                    _logger.LogInformation($"Payment is PAID, updating invoice {invoice.InvoiceId} to PAID status");

                    var success = _invoiceService.UpdateInvoiceStatus(
                        invoice.InvoiceId,
                        Models.InvoiceStatus.Paid,
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
                        Models.InvoiceStatus.Cancelled
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

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "Payment controller is working" });
        }


        [AllowAnonymous]
        [HttpGet("success")]
        public async Task<IActionResult> PaymentSuccess([FromQuery] string orderCode)
        {
            // Log the successful payment
            _logger.LogInformation($"Payment successful for order: {orderCode}");

            string statusMessage = "Thank you for your payment. Your rental has been confirmed.";
            string additionalInfo = "";

            // Try to automatically check and update the payment status
            if (!string.IsNullOrEmpty(orderCode) && int.TryParse(orderCode, out int orderCodeInt))
            {
                try
                {
                    _logger.LogInformation($"Auto-checking payment status for order: {orderCodeInt}");
                    
                    // Get payment status from PayOS
                    var paymentStatus = await _payOSService.GetPaymentStatus(orderCodeInt);
                    _logger.LogInformation($"PayOS payment status: {paymentStatus.status}");

                    // Find and update the invoice if needed
                    var invoice = _invoiceService.GetInvoiceByOrderCode(orderCodeInt);
                    if (invoice != null)
                    {
                        if (paymentStatus.status == "PAID" && invoice.Status != Models.InvoiceStatus.Paid)
                        {
                            _logger.LogInformation($"Auto-updating invoice {invoice.InvoiceId} to PAID status");
                            
                            var success = _invoiceService.UpdateInvoiceStatus(
                                invoice.InvoiceId,
                                Models.InvoiceStatus.Paid,
                                invoice.AmountDue
                            );

                            if (success)
                            {
                                statusMessage = "✅ Payment confirmed! Your rental has been confirmed and invoice updated.";
                                additionalInfo = $"Invoice #{invoice.InvoiceId} has been marked as PAID.";
                            }
                            else
                            {
                                statusMessage = "Payment received but there was an issue updating the invoice. Please contact support.";
                                additionalInfo = $"Invoice #{invoice.InvoiceId} needs manual review.";
                            }
                        }
                        else if (invoice.Status == Models.InvoiceStatus.Paid)
                        {
                            statusMessage = "✅ Payment already confirmed! Your rental is ready.";
                            additionalInfo = $"Invoice #{invoice.InvoiceId} is already marked as PAID.";
                        }
                        else
                        {
                            statusMessage = "Payment received. Processing your rental confirmation...";
                            additionalInfo = $"Payment status: {paymentStatus.status}. Invoice status: {invoice.Status}";
                        }
                    }
                    else
                    {
                        statusMessage = "Payment received but invoice not found. Please contact support.";
                        additionalInfo = $"Order code: {orderCode}";
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error auto-checking payment status");
                    statusMessage = "Payment received. We're processing your rental confirmation...";
                    additionalInfo = "If you don't receive confirmation within 24 hours, please contact support.";
                }
            }

            return Content(@"
            <html>
                <body style='text-align: center; padding: 50px; font-family: Arial;'>
                    <h1>✅ Payment Successful!</h1>
                    <p>" + statusMessage + @"</p>
                    <p>Order Code: " + orderCode + @"</p>
                    " + (!string.IsNullOrEmpty(additionalInfo) ? "<p style='color: #666; font-size: 14px;'>" + additionalInfo + "</p>" : "") + @"
                    <a href='/'>Return to Home</a>
                </body>
            </html>", "text/html");
        }

        [AllowAnonymous]
        [HttpGet("cancel")]
        public IActionResult PaymentCancel()
        {
            return Content(@"
            <html>
                <body style='text-align: center; padding: 50px; font-family: Arial;'>
                    <h1>❌ Payment Cancelled</h1>
                    <p>Your payment was cancelled. You can try again anytime.</p>
                    <a href='/'>Return to Home</a>
                </body>
            </html>", "text/html");
        }
    }

    public class CreatePaymentRequest
    {
        public int InvoiceId { get; set; }
        public int RenterId { get; set; }
    }
}