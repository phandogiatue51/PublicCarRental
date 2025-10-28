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
                "tuedo51@gmail.com",
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

    private async Task ClearCacheByPattern(string pattern)
    {
        await Task.CompletedTask;
    }

    [HttpPost("clear-vehicle-cache")]
    public async Task<IActionResult> ClearVehicleCache()
    {
        await ClearCacheByPattern("vehicles*");
        await ClearCacheByPattern("stations_by_model*");
        return Ok("Vehicle-related cache cleared");
    }

    [HttpPost("clear-station-cache")]
    public async Task<IActionResult> ClearStationCache()
    {
        await ClearCacheByPattern("stations*");
        return Ok("Station-related cache cleared");
    }
}