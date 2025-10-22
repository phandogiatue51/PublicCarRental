using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Email;
using PublicCarRental.Application.Service.PDF;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace PublicCarRental.Application.Service.Rabbit
{
    public class ContractGenerationConsumerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ContractGenerationConsumerService> _logger;
        private readonly string _queueName = "contract_generation_queue";

        public ContractGenerationConsumerService(IServiceProvider serviceProvider, ILogger<ContractGenerationConsumerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("📄 Contract Generation Consumer started");

            using var scope = _serviceProvider.CreateScope();
            var connection = scope.ServiceProvider.GetRequiredService<IRabbitMQConnection>();

            var channel = await connection.CreateChannelAsync();

            try
            {
                var dlqArgs = new Dictionary<string, object>
                {
                    { "x-dead-letter-exchange", "" },
                    { "x-dead-letter-routing-key", "contract_generation_dlq" }
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
                        var contractEvent = JsonSerializer.Deserialize<ContractGenerationEvent>(messageJson);

                        _logger.LogInformation("Processing contract generation for contract {ContractId}", contractEvent.ContractId);

                        await ProcessContractGenerationAsync(contractEvent);

                        if (channel.IsOpen)
                        {
                            await channel.BasicAckAsync(ea.DeliveryTag, false);
                            _logger.LogInformation("Contract generated for contract {ContractId}", contractEvent.ContractId);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing contract generation for delivery tag {DeliveryTag}", ea.DeliveryTag);
                        if (channel.IsOpen)
                        {
                            await channel.BasicNackAsync(ea.DeliveryTag, false, false);
                        }
                    }
                };

                await channel.BasicConsumeAsync(queue: _queueName, autoAck: false, consumer: consumer);
                _logger.LogInformation("✅ Contract Generation Consumer listening on {QueueName}", _queueName);

                while (!stoppingToken.IsCancellationRequested && channel.IsOpen)
                {
                    await Task.Delay(1000, stoppingToken);
                }
            }
            finally
            {
                if (channel?.IsOpen == true)
                {
                    await channel.CloseAsync();
                }
                channel?.Dispose();
            }
        }

        private async Task ProcessContractGenerationAsync(ContractGenerationEvent contractEvent)
        {
            using var scope = _serviceProvider.CreateScope();
            var pdfContractService = scope.ServiceProvider.GetRequiredService<IPdfService>();
            var contractService = scope.ServiceProvider.GetRequiredService<IContractService>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var pdfStorageService = scope.ServiceProvider.GetRequiredService<IPdfStorageService>();

            try
            {
                var contract = contractService.GetEntityById(contractEvent.ContractId);
                if (contract == null)
                {
                    _logger.LogWarning("Contract {ContractId} not found for contract generation", contractEvent.ContractId);
                    return;
                }

                // Generate contract PDF using the staff name from the event
                var contractBytes = pdfContractService.GenerateRentalContract(
                    contract,
                    contractEvent.StaffName
                );

                // Save to storage
                await pdfStorageService.SaveContractPdfAsync(contract.ContractId, contractBytes);

                // Send email with contract
                await emailService.SendContractPdfAsync(
                    contractEvent.RenterEmail,
                    contractEvent.RenterName,
                    contractBytes,
                    contractEvent.ContractId
                );

                _logger.LogInformation("Contract emailed to {Email} for contract {ContractId}",
                    contractEvent.RenterEmail, contractEvent.ContractId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate contract for contract {ContractId}", contractEvent.ContractId);
                throw;
            }
        }
    }
}