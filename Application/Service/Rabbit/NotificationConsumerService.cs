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

                var channel = await connection.CreateChannelAsync();

                try
                {
                    await channel.BasicQosAsync(0, 1, false);
                    _logger.LogInformation("✅ QoS set (prefetch=1)");

                    var dlqArgs = new Dictionary<string, object>
            {
                { "x-dead-letter-exchange", "" },
                { "x-dead-letter-routing-key", "notification_dlq" }
            };

                    await channel.QueueDeclareAsync(
                        queue: _queueName,
                        durable: true,
                        exclusive: false,
                        autoDelete: false,
                        arguments: dlqArgs
                    );

                    _logger.LogInformation("✅ Queue declared: {QueueName}", _queueName);

                    var consumer = new AsyncEventingBasicConsumer(channel);
                    consumer.ReceivedAsync += async (model, ea) =>
                    {
                        bool shouldAck = false;

                        try
                        {
                            _logger.LogInformation("📨 MESSAGE RECEIVED - Processing started | DeliveryTag={DeliveryTag} Redelivered={Redelivered}", ea.DeliveryTag, ea.Redelivered);

                            var body = ea.Body.ToArray();
                            var messageJson = Encoding.UTF8.GetString(body);

                            using var scope = _serviceProvider.CreateScope();
                            var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();

                            _logger.LogInformation("Processing message: {MessageJson}", messageJson);

                            try
                            {
                                using var doc = JsonDocument.Parse(messageJson);
                                if (doc.RootElement.TryGetProperty("EventType", out var eventTypeProp))
                                {
                                    var eventType = eventTypeProp.GetString();
                                    switch (eventType)
                                    {
                                        case "BookingCreated":
                                            var bookingCreated = JsonSerializer.Deserialize<BookingCreatedEvent>(messageJson);
                                            await ProcessBookingNotificationAsync(hubContext, bookingCreated);
                                            break;
                                        case "BookingConfirmed":
                                            var bookingConfirmed = JsonSerializer.Deserialize<BookingConfirmedEvent>(messageJson);
                                            await ProcessBookingConfirmedNotificationAsync(hubContext, bookingConfirmed);
                                            break;
                                        default:
                                            _logger.LogWarning("Unhandled EventType: {EventType}", eventType);
                                            break;
                                    }
                                }
                                else if (messageJson.Contains("BookingId"))
                                {
                                    var bookingCreated = JsonSerializer.Deserialize<BookingCreatedEvent>(messageJson);
                                    await ProcessBookingNotificationAsync(hubContext, bookingCreated);
                                }
                                else
                                {
                                    _logger.LogWarning("Unknown message type received: {MessageJson}", messageJson);
                                }

                                shouldAck = true;
                            }
                            catch (JsonException ex)
                            {
                                _logger.LogError(ex, "Failed to parse message JSON");
                                shouldAck = false;
                            }

                            if (channel.IsOpen)
                            {
                                if (shouldAck)
                                {
                                    await channel.BasicAckAsync(ea.DeliveryTag, false);
                                    _logger.LogInformation("✅ Notification processed and sent via SignalR");
                                }
                                else
                                {
                                    await channel.BasicNackAsync(ea.DeliveryTag, false, false);
                                    _logger.LogWarning("❌ Notification message rejected and sent to DLQ");
                                }
                            }
                            else
                            {
                                _logger.LogWarning("Channel closed, cannot ack/nack notification message");
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "❌ Error processing notification message");
                            if (channel.IsOpen)
                            {
                                await channel.BasicNackAsync(ea.DeliveryTag, false, false);
                            }
                        }
                    };

                    var consumerTag = await channel.BasicConsumeAsync(queue: _queueName, autoAck: false, consumer: consumer);
                    _logger.LogInformation("✅ NOTIFICATION CONSUMER LISTENING on {QueueName}", _queueName);

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
                _logger.LogError(ex, "CRITICAL ERROR in NotificationConsumerService");
                throw;
            }
        }

        private async Task ProcessBookingNotificationAsync(IHubContext<NotificationHub> hubContext, BookingCreatedEvent bookingEvent)
        {
            await hubContext.Clients.Group($"station-{bookingEvent.StationId}").SendAsync("ReceiveBookingNotification", new
            {
                Type = "NewBooking",
                BookingId = bookingEvent.BookingId,
                StationId = bookingEvent.StationId,
                StartTime = bookingEvent.StartTime,
                Message = $"New booking received at your station"
            });

            _logger.LogInformation("Booking notification sent to station {StationId} for booking {BookingId}",
                bookingEvent.StationId, bookingEvent.BookingId);
        }

        private async Task ProcessBookingConfirmedNotificationAsync(IHubContext<NotificationHub> hubContext, BookingConfirmedEvent bookingEvent)
        {
            if (bookingEvent == null)
            {
                _logger.LogWarning("BookingConfirmedEvent is null");
                return;
            }

            if (bookingEvent.RenterId > 0)
            {
                await hubContext.Clients.Group($"user-{bookingEvent.RenterId}").SendAsync("ReceiveBookingConfirmed", new
                {
                    Type = "BookingConfirmed",
                    BookingId = bookingEvent.BookingId,
                    StartTime = bookingEvent.StartTime,
                    EndTime = bookingEvent.EndTime,
                    TotalCost = bookingEvent.TotalCost,
                    Message = "Your booking has been confirmed and the rental has started."
                });
            }

            _logger.LogInformation("Booking confirmed notification sent for booking {BookingId}", bookingEvent.BookingId);
        }
    }
}