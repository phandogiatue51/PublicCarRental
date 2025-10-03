using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Newtonsoft.Json;
using PublicCarRental.Service.Inv;
using PublicCarRental.Service.Pay;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableRateLimiting("PaymentPolicy")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(IPaymentService paymentService, ILogger<PaymentController> logger,
            IInvoiceService invoiceService)
        {
            _paymentService = paymentService;
            _logger = logger;
            _invoiceService = invoiceService;
        }

        [HttpPost("create/{invoiceId}")]
        public async Task<IActionResult> CreatePayment(int invoiceId)
        {
            try
            {
                // Better validation
                if (invoiceId <= 0)
                    return BadRequest(new { error = "Invalid invoice ID" });

                // Get renter ID from authentication - add null checking
                var renterIdClaim = User.FindFirst("renterId");
                if (renterIdClaim == null || !int.TryParse(renterIdClaim.Value, out int renterId) || renterId <= 0)
                    return Unauthorized(new { error = "Invalid user" });

                var paymentResponse = await _paymentService.CreatePaymentAsync(invoiceId, renterId);
                return Ok(paymentResponse);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid request for payment creation");
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized payment attempt");
                return Unauthorized(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook()
        {
            try
            {
                // Read the raw body for signature verification
                using var reader = new StreamReader(HttpContext.Request.Body);
                var body = await reader.ReadToEndAsync();

                // Log webhook receipt (be careful not to log sensitive data in production)
                _logger.LogInformation("Webhook received: {Body}", body);

                var webhookData = JsonConvert.DeserializeObject<dynamic>(body);

                var result = await _paymentService.HandleWebhook(webhookData);

                if (result)
                {
                    return Ok(new { success = true });
                }
                else
                {
                    _logger.LogWarning("Webhook processing failed");
                    return BadRequest(new { error = "Webhook processing failed" });
                }
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Invalid JSON in webhook");
                return BadRequest(new { error = "Invalid JSON format" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Webhook error");
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

                var status = await _paymentService.GetPaymentStatusAsync(orderCode);
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment status for order {OrderCode}", orderCode);
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("invoice/{invoiceId}/status")]
        public async Task<IActionResult> GetPaymentStatusByInvoiceId(int invoiceId)
        {
            try
            {
                if (invoiceId <= 0)
                    return BadRequest(new { error = "Invalid invoice ID" });

                // Get the invoice to find the order code
                var invoice = _invoiceService.GetEntityById(invoiceId);
                if (invoice == null)
                    return NotFound(new { error = "Invoice not found" });

                if (invoice.OrderCode == null)
                    return BadRequest(new { error = "No payment associated with this invoice" });

                var status = await _paymentService.GetPaymentStatusAsync(invoice.OrderCode.Value);
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment status for invoice {InvoiceId}", invoiceId);
                return BadRequest(new { error = ex.Message });
            }
        }

    }
}
