using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Models.Configuration;
using PublicCarRental.Infrastructure.Signal;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace PublicCarRental.Application.Service.Rabbit
{
    public class AccidentConsumerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly string _connectionString;
        private readonly string _queueName;
        private readonly ILogger<AccidentConsumerService> _logger;

        public AccidentConsumerService(IServiceProvider serviceProvider, IOptions<RabbitMQSettings> rabbitMQSettings, 
            ILogger<AccidentConsumerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _connectionString = rabbitMQSettings.Value.ConnectionString;
            _queueName = rabbitMQSettings.Value.QueueNames.AccidentQueue; 

            _logger.LogInformation("🚗 ACCIDENT CONSUMER CONSTRUCTOR CALLED");
            _logger.LogInformation("🚗 QueueName: {QueueName}", _queueName);

            if (string.IsNullOrEmpty(_connectionString))
                throw new ArgumentNullException(nameof(_connectionString), "RabbitMQ ConnectionString is not configured.");

            if (string.IsNullOrEmpty(_queueName))
                throw new ArgumentNullException(nameof(_queueName), "AccidentQueue name is not configured.");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 ACCIDENT CONSUMER STARTED");

            try
            {
                var factory = new ConnectionFactory { Uri = new Uri(_connectionString) };
                using var connection = await factory.CreateConnectionAsync();

                var channel = await connection.CreateChannelAsync();

                try
                {
                    await channel.BasicQosAsync(0, 2, false);
                    _logger.LogInformation("✅ Accident QoS set (prefetch=2)");

                    var dlqArgs = new Dictionary<string, object>
                    {
                        { "x-dead-letter-exchange", "" },
                        { "x-dead-letter-routing-key", "accident_dlq" }
                    };

                    await channel.QueueDeclareAsync(
                        queue: _queueName,
                        durable: true,
                        exclusive: false,
                        autoDelete: false,
                        arguments: dlqArgs
                    );

                    _logger.LogInformation("✅ Accident Queue declared: {QueueName}", _queueName);

                    var consumer = new AsyncEventingBasicConsumer(channel);
                    consumer.ReceivedAsync += async (model, ea) =>
                    {
                        try
                        {
                            _logger.LogWarning("🚨 ACCIDENT MESSAGE RECEIVED | DeliveryTag={DeliveryTag}", ea.DeliveryTag);

                            var body = ea.Body.ToArray();
                            var messageJson = Encoding.UTF8.GetString(body);

                            using var scope = _serviceProvider.CreateScope();
                            var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();

                            var accidentEvent = JsonSerializer.Deserialize<AccidentReportedEvent>(messageJson);
                            var contractAccidentHandler = scope.ServiceProvider.GetRequiredService<IContractAccidentHandler>(); // ✅ Get scoped service

                            await ProcessAccidentNotificationAsync(hubContext, contractAccidentHandler, accidentEvent);

                            if (channel.IsOpen)
                            {
                                await channel.BasicAckAsync(ea.DeliveryTag, false);
                                _logger.LogWarning("✅ Accident notification processed: {AccidentId}", accidentEvent.AccidentId);
                            }
                            else
                            {
                                _logger.LogWarning("Channel closed, cannot ack accident message {AccidentId}", accidentEvent.AccidentId);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "❌ ERROR processing accident message");
                            if (channel.IsOpen)
                            {
                                await channel.BasicNackAsync(ea.DeliveryTag, false, false);
                            }
                        }
                    };

                    await channel.BasicConsumeAsync(
                        queue: _queueName,
                        autoAck: false,
                        consumer: consumer
                    );

                    _logger.LogInformation("✅ ACCIDENT CONSUMER LISTENING on {QueueName}", _queueName);

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
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 CRITICAL ERROR in AccidentConsumerService");
                throw;
            }
        }
        private async Task ProcessAccidentNotificationAsync(IHubContext<NotificationHub> hubContext, IContractAccidentHandler contractAccidentHandler,
        AccidentReportedEvent accidentEvent)
        {
            if (accidentEvent == null)
            {
                _logger.LogError("🚨 AccidentEvent is NULL");
                return;
            }

            var affectedContracts = await contractAccidentHandler.GetAffectedContractsAsync(accidentEvent.VehicleId);

            if (affectedContracts.Any())
            {
                await SendApprovalRequestAsync(hubContext, accidentEvent, affectedContracts);
            }
            else
            {
                accidentEvent.ActionStatus = AccidentActionStatus.AutoProcessed;
                await SendStandardNotificationAsync(hubContext, accidentEvent);
            }
        }

        private async Task SendApprovalRequestAsync(IHubContext<NotificationHub> hubContext, AccidentReportedEvent accidentEvent, List<RentalContract> affectedContracts)
        {
            var approvalRequest = new
            {
                Type = "AccidentApprovalRequired",
                AccidentId = accidentEvent.AccidentId,
                VehicleId = accidentEvent.VehicleId,
                VehicleLicensePlate = accidentEvent.VehicleLicensePlate ?? "Unknown Vehicle",
                Location = accidentEvent.Location ?? "Unknown Location",
                ReportedAt = accidentEvent.ReportedAt,
                AffectedContracts = affectedContracts.Select(c => new {
                    ContractId = c.ContractId,
                    RenterId = c.EVRenterId,
                    StartTime = c.StartTime,
                    EndTime = c.EndTime,
                    Status = c.Status.ToString()
                }),
                Message = $"🚨 Accident affects {affectedContracts.Count} future contracts. Approval required for vehicle replacement.",
                Priority = "HIGH",
                RequiresApproval = true,
                Timestamp = DateTime.UtcNow
            };

            await hubContext.Clients.Group("admin").SendAsync("ReceiveAccidentApprovalRequest", approvalRequest);

            _logger.LogWarning("🚨 Approval request sent to admins for Accident {AccidentId} affecting {ContractCount} contracts",
                accidentEvent.AccidentId, affectedContracts.Count);
        }

        private async Task SendStandardNotificationAsync(IHubContext<NotificationHub> hubContext, AccidentReportedEvent accidentEvent)
        {
            await hubContext.Clients.Group("admin").SendAsync("ReceiveAccidentNotification", new
            {
                Type = "AccidentReported",
                AccidentId = accidentEvent.AccidentId,
                VehicleId = accidentEvent.VehicleId,
                VehicleLicensePlate = accidentEvent.VehicleLicensePlate ?? "Unknown Vehicle",
                Location = accidentEvent.Location ?? "Unknown Location",
                ReportedAt = accidentEvent.ReportedAt,
                Message = $"🚨 Accident at {accidentEvent.Location} - No future contracts affected",
                Priority = "MEDIUM",
                RequiresImmediateAction = false
            });
        }
    }
}