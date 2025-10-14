using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Email;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace PublicCarRental.Application.Service.Rabbit
{
    public class PdfGenerationConsumerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PdfGenerationConsumerService> _logger;
        private readonly string _queueName = "pdf_generation_queue";

        public PdfGenerationConsumerService(IServiceProvider serviceProvider, ILogger<PdfGenerationConsumerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("📄 PDF Generation Consumer started");

            using var scope = _serviceProvider.CreateScope();
            var connection = scope.ServiceProvider.GetRequiredService<IRabbitMQConnection>();

            using var channel = await connection.CreateChannelAsync();

            var dlqArgs = new Dictionary<string, object>
        {
            { "x-dead-letter-exchange", "" },
            { "x-dead-letter-routing-key", "pdf_generation_dlq" }
        };

            await channel.QueueDeclareAsync(
                queue: _queueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: dlqArgs
            );

            await channel.QueueDeclareAsync(
                queue: "pdf_generation_dlq",
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null
            );

            await channel.BasicQosAsync(0, 1, false);

            var consumer = new AsyncEventingBasicConsumer(channel);
            consumer.ReceivedAsync += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var messageJson = Encoding.UTF8.GetString(body);
                    var pdfEvent = JsonSerializer.Deserialize<PdfGenerationEvent>(messageJson);

                    _logger.LogInformation("Processing PDF generation for contract {ContractId}", pdfEvent.ContractId);

                    await ProcessPdfGenerationAsync(pdfEvent);

                    await channel.BasicAckAsync(ea.DeliveryTag, false);
                    _logger.LogInformation("PDF generated for contract {ContractId}", pdfEvent.ContractId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing PDF generation for delivery tag {DeliveryTag}", ea.DeliveryTag);

                    await channel.BasicNackAsync(ea.DeliveryTag, false, false);
                }
            };

            await channel.BasicConsumeAsync(queue: _queueName, autoAck: false, consumer: consumer);

            _logger.LogInformation("✅ PDF Generation Consumer listening on {QueueName}", _queueName);
        }

        private async Task ProcessPdfGenerationAsync(PdfGenerationEvent pdfEvent)
        {
            using var scope = _serviceProvider.CreateScope();
            var pdfService = scope.ServiceProvider.GetRequiredService<PdfContractService>();
            var contractService = scope.ServiceProvider.GetRequiredService<IContractService>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var pdfStorageService = scope.ServiceProvider.GetRequiredService<IPdfStorageService>();

            try
            {
                var contract = contractService.GetEntityById(pdfEvent.ContractId);
                if (contract == null)
                {
                    _logger.LogWarning("Contract {ContractId} not found for PDF generation", pdfEvent.ContractId);
                    return;
                }

                var pdfBytes = pdfService.GenerateRentalContract(contract);

                await pdfStorageService.SaveContractPdfAsync(contract.ContractId, pdfBytes);

                await emailService.SendContractPdfAsync(
                    pdfEvent.RenterEmail,
                    pdfEvent.RenterName,
                    pdfBytes,
                    pdfEvent.ContractId
                );

                _logger.LogInformation("PDF emailed to {Email} for contract {ContractId}",
                    pdfEvent.RenterEmail, pdfEvent.ContractId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate PDF for contract {ContractId}", pdfEvent.ContractId);
                throw;
            }
        }
    }
}
