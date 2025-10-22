using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Email;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.PDF;
using PublicCarRental.Application.Service.Ren;
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
            var renterService = scope.ServiceProvider.GetRequiredService<IEVRenterService>();


            try
            {
                _logger.LogInformation("🔍 Starting receipt generation for Invoice {InvoiceId}, Contract {ContractId}, Renter {RenterId}", 
                    receiptEvent.InvoiceId, receiptEvent.ContractId, receiptEvent.RenterId);

                var invoice = invoiceService.GetEntityById(receiptEvent.InvoiceId);
                _logger.LogInformation("📄 Invoice loaded: {InvoiceFound}", invoice != null ? "YES" : "NO");
                
                var contract = contractService.GetEntityById(receiptEvent.ContractId);
                _logger.LogInformation("📋 Contract loaded: {ContractFound}", contract != null ? "YES" : "NO");
                
                var renter = await renterService.GetEntityByIdAsync(receiptEvent.RenterId);
                _logger.LogInformation("👤 Renter loaded: {RenterFound}", renter != null ? "YES" : "NO");

                if (invoice == null)
                {
                    _logger.LogWarning("Invoice {InvoiceId} not found for receipt generation", receiptEvent.InvoiceId);
                    return;
                }

                if (contract == null)
                {
                    _logger.LogWarning("Contract {ContractId} not found for receipt generation", receiptEvent.ContractId);
                    return;
                }

                if (renter == null)
                {
                    _logger.LogWarning("Renter {RenterId} not found for receipt generation", receiptEvent.RenterId);
                    return;
                }

                _logger.LogInformation("🎯 All entities loaded successfully, generating PDF...");
                var receiptBytes = pdfReceiptService.GeneratePaymentReceipt(invoice, contract);
                _logger.LogInformation("📄 PDF generated successfully, size: {Size} bytes", receiptBytes.Length);

                _logger.LogInformation("💾 Saving PDF to storage...");
                await pdfStorageService.SaveReceiptPdfAsync(invoice.InvoiceId, receiptBytes);
                _logger.LogInformation("✅ PDF saved to storage");

                _logger.LogInformation("📧 Sending receipt email to {Email}...", renter.Account.Email);
                await emailService.SendReceiptPdfAsync(
                   renter.Account.Email,
                   renter.Account.FullName,
                   receiptBytes,
                   invoice.InvoiceId
                );

                _logger.LogInformation("✅ Receipt emailed to {Email} for invoice {InvoiceId}",
                    renter.Account.Email, invoice.InvoiceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate receipt for invoice {InvoiceId}", receiptEvent.InvoiceId);
                throw;
            }
        }
    }
}