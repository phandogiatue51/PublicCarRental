using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Models.Configuration;
using RabbitMQ.Client;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DebugController : ControllerBase
    {
        private readonly ILogger<DebugController> _logger;
        private readonly RabbitMQSettings _settings;
        private readonly AccidentEventProducerService _producerService;

        public DebugController(
            IOptions<RabbitMQSettings> settings,
            AccidentEventProducerService producerService,
            ILogger<DebugController> logger)
        {
            _settings = settings.Value;
            _producerService = producerService;
            _logger = logger;
        }

        [HttpGet("rabbitmq-status")]
        public async Task<IActionResult> CheckRabbitMQStatus()
        {
            try
            {
                var factory = new ConnectionFactory { Uri = new Uri(_settings.ConnectionString) };
                using var connection = await factory.CreateConnectionAsync();
                using var channel = await connection.CreateChannelAsync();

                var result = await channel.QueueDeclarePassiveAsync(_settings.QueueNames.NotificationQueue);

                return Ok(new
                {
                    Status = "Connected",
                    Queue = _settings.QueueNames.NotificationQueue,
                    MessageCount = result.MessageCount,
                    ConsumerCount = result.ConsumerCount,
                    ConnectionString = _settings.ConnectionString?.Substring(0, 20) + "..."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to RabbitMQ");
                return BadRequest(new { Status = "Failed", Error = ex.Message });
            }
        }

        [HttpPost("test-accident")]
        public async Task<IActionResult> TestAccidentNotification()
        {
            var testAccident = new AccidentReport
            {
                AccidentId = 999,
                VehicleId = 1,
                ContractId = 1,
                StaffId = 1,
                Description = "Test accident notification",
                Location = "Test Location",
                ReportedAt = DateTime.Now
            };

            await _producerService.PublishAccidentReportedAsync(testAccident);
            return Ok("Test accident notification sent");
        }
    }
}
