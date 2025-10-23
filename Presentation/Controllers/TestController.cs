using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.Service.Email;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly IEmailService _emailService;

    public TestController(IEmailService emailService)
    {
        _emailService = emailService;
    }

    [HttpPost("test-email")]
    public async Task<IActionResult> TestEmail()
    {
        try
        {
            await _emailService.SendEmail(
                "phandogiatue51@gmail.com",
                "Test Email from HttpClient",
                "<h1>It works! 🎉</h1><p>This email was sent via HttpClient + Resend API</p>"
            );
            return Ok("Email sent successfully!");
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed: {ex.Message}");
        }
    }
}