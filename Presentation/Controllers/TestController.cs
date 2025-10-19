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
        private readonly IConfiguration _config;

        public TestController(IServiceProvider serviceProvider, ILogger<TestController> logger, IConfiguration config)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _config = config;
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

        [HttpGet("check-sendgrid-usage")]
        public async Task<IActionResult> CheckSendGridUsage()
        {
            try
            {
                var apiKey = _config["EmailSettings:Password"]; 
                var client = new HttpClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                var response = await client.GetAsync("https://api.sendgrid.com/v3/stats?limit=1");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation("📊 SendGrid API response: {Response}", content);
                    return Ok(new { status = "✅ API accessible", data = content });
                }
                else
                {
                    _logger.LogWarning("❌ SendGrid API returned: {StatusCode}", response.StatusCode);
                    return BadRequest(new { status = $"❌ API error: {response.StatusCode}" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ SendGrid API check failed");
                return BadRequest(new { status = $"❌ API error: {ex.Message}" });
            }
        }

        [HttpGet("check-sendgrid-status")]
        public async Task<IActionResult> CheckSendGridStatus()
        {
            try
            {
                var smtpServer = "smtp.sendgrid.net";
                var port = 587;

                _logger.LogInformation("🔍 Checking SendGrid status...");

                var hostEntry = await System.Net.Dns.GetHostEntryAsync(smtpServer);
                _logger.LogInformation("✅ DNS resolved to: {IPs}",
                    string.Join(", ", hostEntry.AddressList.Select(ip => ip.ToString())));

                using var tcpClient = new System.Net.Sockets.TcpClient();
                var timeoutTask = Task.Delay(5000);
                var connectTask = tcpClient.ConnectAsync(smtpServer, port);

                if (await Task.WhenAny(connectTask, timeoutTask) == connectTask)
                {
                    _logger.LogInformation("✅ TCP connection successful");
                    tcpClient.Close();

                    using var smtpClient = new MailKit.Net.Smtp.SmtpClient();
                    smtpClient.Timeout = 10000;

                    await smtpClient.ConnectAsync(smtpServer, port, MailKit.Security.SecureSocketOptions.StartTls);
                    _logger.LogInformation("✅ SMTP connection successful");

                    await smtpClient.DisconnectAsync(true);
                    return Ok(new
                    {
                        status = "✅ All connectivity tests passed",
                        dns = hostEntry.AddressList.Select(ip => ip.ToString()).ToArray(),
                        tcp = "success",
                        smtp = "success"
                    });
                }
                else
                {
                    _logger.LogError("❌ TCP connection timeout");
                    return BadRequest(new { status = "❌ TCP connection timeout" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ SendGrid status check failed");
                return BadRequest(new { status = $"❌ Error: {ex.Message}" });
            }
        }

        [HttpGet("test-email-fallback")]
        public async Task<IActionResult> TestEmailFallback()
        {
            try
            {
                var emailService = HttpContext.RequestServices.GetRequiredService<IEmailService>();

                _logger.LogInformation("🚀 Testing email with fallback strategy...");

                await emailService.SendEmail(
                    "your-email@gmail.com",
                    "Test Email Fallback Strategy",
                    "<h1>Test Email</h1><p>This tests both SMTP and API fallback.</p>"
                );

                return Ok("✅ Email test completed - check logs for delivery method used");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Email fallback test failed");
                return BadRequest($"❌ Test failed: {ex.Message}");
            }
        }
    }
}
