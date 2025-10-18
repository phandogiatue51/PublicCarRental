using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.Service.Email;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TestController> _logger;
        public TestController(IServiceProvider serviceProvider, ILogger<TestController> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        [HttpGet("test-email-send")]
        public async Task<IActionResult> TestEmailSend()
        {
            try
            {
                var emailService = _serviceProvider.GetRequiredService<IEmailService>();

                _logger.LogInformation("🚀 Starting email test...");

                await emailService.SendEmail(
                    "phandogiatue51@gmail.com", // Use a DIFFERENT email to test
                    "Test Email from PublicCarRental",
                    "<h1>Test Email</h1><p>This is a <b>test email</b> from PublicCarRental app.</p>"
                );

                _logger.LogInformation("✅ Test email completed without errors");
                return Ok("✅ Test email sent successfully - check logs for details");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Test email failed");
                return BadRequest($"❌ Test email failed: {ex.Message}");
            }
        }
    }
}
