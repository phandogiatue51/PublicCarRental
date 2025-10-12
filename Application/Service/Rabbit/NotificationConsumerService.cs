using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Infrastructure.Data.Models.Configuration;
using PublicCarRental.Infrastructure.Signal;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace PublicCarRental.Application.Service.Rabbit
{
    public class NotificationConsumerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly string _connectionString;
        private readonly string _queueName;
        private readonly ILogger<NotificationConsumerService> _logger;

        public NotificationConsumerService(IServiceProvider serviceProvider, IOptions<RabbitMQSettings> rabbitMQSettings,
    ILogger<NotificationConsumerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;

            _connectionString = rabbitMQSettings.Value.ConnectionString;
            _queueName = rabbitMQSettings.Value.QueueNames.NotificationQueue;

            // CRITICAL: Add these logs to see if constructor is called
            _logger.LogInformation("🎯 NOTIFICATION CONSUMER CONSTRUCTOR CALLED");
            _logger.LogInformation("🎯 ConnectionString present: {HasConnection}", !string.IsNullOrEmpty(_connectionString));
            _logger.LogInformation("🎯 QueueName: {QueueName}", _queueName);

            if (string.IsNullOrEmpty(_connectionString))
            {
                throw new ArgumentNullException(nameof(_connectionString), "RabbitMQ ConnectionString is not configured.");
            }

            if (string.IsNullOrEmpty(_queueName))
            {
                throw new ArgumentNullException(nameof(_queueName), "NotificationQueue name is not configured.");
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // CRITICAL: Log that the service is starting
            _logger.LogInformation("🚀 NOTIFICATION CONSUMER ExecuteAsync STARTED");

            if (string.IsNullOrEmpty(_connectionString))
            {
                _logger.LogError("Connection string is null or empty");
                throw new InvalidOperationException("RabbitMQ connection string is not configured.");
            }

            try
            {
                _logger.LogInformation("🔗 Creating RabbitMQ connection...");
                var factory = new ConnectionFactory
                {
                    Uri = new Uri(_connectionString),
                };

                using var connection = await factory.CreateConnectionAsync();
                _logger.LogInformation("✅ RabbitMQ connection established");

                using var channel = await connection.CreateChannelAsync();
                _logger.LogInformation("✅ RabbitMQ channel created");

                await channel.QueueDeclareAsync(
                    queue: _queueName,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null
                );

                _logger.LogInformation("✅ Queue declared: {QueueName}", _queueName);

                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.ReceivedAsync += async (model, ea) =>
                {
                    try
                    {
                        _logger.LogInformation("📨 📨 📨 MESSAGE RECEIVED - Processing started");

                        var body = ea.Body.ToArray();
                        var messageJson = Encoding.UTF8.GetString(body);

                        using var scope = _serviceProvider.CreateScope();
                        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();

                        _logger.LogInformation("Processing message: {MessageJson}", messageJson);

                        if (messageJson.Contains("BookingId"))
                        {
                            var bookingEvent = JsonSerializer.Deserialize<BookingCreatedEvent>(messageJson);
                            await ProcessBookingNotificationAsync(hubContext, bookingEvent);
                        }
                        else if (messageJson.Contains("AccidentId"))
                        {
                            _logger.LogInformation("Processing fixing request notification");
                            var accidentEvent = JsonSerializer.Deserialize<AccidentReportedEvent>(messageJson);
                            await ProcessAccidentNotificationAsync(hubContext, accidentEvent);
                        }
                        else
                        {
                            _logger.LogWarning("Unknown message type received: {MessageJson}", messageJson);
                        }

                        await channel.BasicAckAsync(ea.DeliveryTag, false);
                        _logger.LogInformation("✅ Notification processed and sent via SignalR");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Error processing notification message");
                    }
                };

                await channel.BasicConsumeAsync(queue: _queueName, autoAck: false, consumer: consumer);
                _logger.LogInformation("🎉 NOTIFICATION CONSUMER SUCCESSFULLY STARTED listening on {QueueName}", _queueName);

                // Keep the service alive - IMPORTANT FIX
                while (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(10000, stoppingToken);
                    _logger.LogInformation("💓 NotificationConsumerService heartbeat - still running at {Time}", DateTime.Now);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ CRITICAL ERROR in NotificationConsumerService");
                throw;
            }
        }

        private async Task ProcessBookingNotificationAsync(IHubContext<NotificationHub> hubContext, BookingCreatedEvent bookingEvent)
        {
            await hubContext.Clients.Group($"station-{bookingEvent.StationId}").SendAsync("ReceiveBookingNotification", new
            {
                Type = "NewBooking",
                BookingId = bookingEvent.BookingId,
                RenterName = bookingEvent.RenterName ?? "Unknown Renter",
                VehicleLicensePlate = bookingEvent.VehicleLicensePlate ?? "Unknown Vehicle",
                StationId = bookingEvent.StationId,
                StationName = bookingEvent.StationName ?? "Unknown Station",
                StartTime = bookingEvent.StartTime,
                Message = $"New booking at {bookingEvent.StationName} by {bookingEvent.RenterName ?? "a renter"}"
            });

            _logger.LogInformation("Booking notification sent to station {StationId} for booking {BookingId}",
                bookingEvent.StationId, bookingEvent.BookingId);

            if (bookingEvent.RenterId > 0)
            {
                await hubContext.Clients.Group($"user-{bookingEvent.RenterId}").SendAsync("ReceiveBookingConfirmation", new
                {
                    Type = "BookingConfirmed",
                    BookingId = bookingEvent.BookingId,
                    Message = $"Your booking at {bookingEvent.StationName} has been created successfully!"
                });
            }
        }

        private async Task ProcessAccidentNotificationAsync(IHubContext<NotificationHub> hubContext, AccidentReportedEvent accidentEvent)
        {
            await hubContext.Clients.Group("admin").SendAsync("ReceiveAccidentNotification", new
            {
                Type = "AccidentReported",
                AccidentId = accidentEvent.AccidentId,
                VehicleId = accidentEvent.VehicleId,
                VehicleLicensePlate = accidentEvent.VehicleLicensePlate ?? "Unknown Vehicle",
                Location = accidentEvent.Location ?? "Unknown Location",
                Message = $"Fixing Request: Vehicle {accidentEvent.VehicleLicensePlate} at {accidentEvent.Location}"
            });

            _logger.LogWarning("Fixing Request notification sent to admins for vehicle {VehicleId}", accidentEvent.VehicleId);
        }
    }
}