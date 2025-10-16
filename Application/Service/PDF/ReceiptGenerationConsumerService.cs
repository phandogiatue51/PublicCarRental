using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Email;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.PDF;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace PublicCarRental.Application.Service.Rabbit
{
    public class ReceiptGenerationConsumerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReceiptGenerationConsumerService> _logger;
        private readonly string _queueName = "receipt_generation_queue";

        public ReceiptGenerationConsumerService(IServiceProvider serviceProvider, ILogger<ReceiptGenerationConsumerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🧾 Receipt Generation Consumer started");

            using var scope = _serviceProvider.CreateScope();
            var connection = scope.ServiceProvider.GetRequiredService<IRabbitMQConnection>();

            using var channel = await connection.CreateChannelAsync();

            var dlqArgs = new Dictionary<string, object>
            {
                { "x-dead-letter-exchange", "" },
                { "x-dead-letter-routing-key", "receipt_generation_dlq" }
            };

            await channel.QueueDeclareAsync(
                queue: _queueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: dlqArgs
            );

            await channel.QueueDeclareAsync(
                queue: "receipt_generation_dlq",
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
                    var receiptEvent = JsonSerializer.Deserialize<ReceiptGenerationEvent>(messageJson);

                    _logger.LogInformation("Processing receipt generation for invoice {InvoiceId}", receiptEvent.InvoiceId);

                    await ProcessReceiptGenerationAsync(receiptEvent);

                    await channel.BasicAckAsync(ea.DeliveryTag, false);
                    _logger.LogInformation("Receipt generated for invoice {InvoiceId}", receiptEvent.InvoiceId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing receipt generation for delivery tag {DeliveryTag}", ea.DeliveryTag);
                    await channel.BasicNackAsync(ea.DeliveryTag, false, false);
                }
            };

            await channel.BasicConsumeAsync(queue: _queueName, autoAck: false, consumer: consumer);
            _logger.LogInformation("✅ Receipt Generation Consumer listening on {QueueName}", _queueName);
        }

        private async Task ProcessReceiptGenerationAsync(ReceiptGenerationEvent receiptEvent)
        {
            using var scope = _serviceProvider.CreateScope();
            var pdfReceiptService = scope.ServiceProvider.GetRequiredService<IPdfService>();
            var contractService = scope.ServiceProvider.GetRequiredService<IContractService>();
            var invoiceService = scope.ServiceProvider.GetRequiredService<IInvoiceService>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var pdfStorageService = scope.ServiceProvider.GetRequiredService<IPdfStorageService>();

            try
            {
                var invoice = invoiceService.GetEntityById(receiptEvent.InvoiceId);
                var contract = contractService.GetEntityById(receiptEvent.ContractId);

                if (invoice == null)
                {
                    _logger.LogWarning("Invoice {InvoiceId} not found for receipt generation", receiptEvent.InvoiceId);
                    return;
                }

                // Generate receipt PDF
                var receiptBytes = pdfReceiptService.GeneratePaymentReceipt(invoice, contract);

                // Save to storage
                await pdfStorageService.SaveReceiptPdfAsync(invoice.InvoiceId, receiptBytes);

                // Send email with receipt
                await emailService.SendReceiptPdfAsync(
                    receiptEvent.RenterEmail,
                    receiptEvent.RenterName,
                    receiptBytes,
                    invoice.InvoiceId
                );

                _logger.LogInformation("Receipt emailed to {Email} for invoice {InvoiceId}",
                    receiptEvent.RenterEmail, receiptEvent.InvoiceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate receipt for invoice {InvoiceId}", receiptEvent.InvoiceId);
                throw;
            }
        }
    }
}