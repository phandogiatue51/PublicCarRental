using Microsoft.AspNetCore.SignalR;
using PublicCarRental.Application.DTOs.Message;
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

        public NotificationConsumerService(
            IConfiguration configuration,
            IServiceProvider serviceProvider,
            ILogger<NotificationConsumerService> logger)
        {
            _serviceProvider = serviceProvider;
            _connectionString = configuration["RabbitMQSettings:ConnectionString"];
            _queueName = configuration["RabbitMQSettings:QueueNames:NotificationQueue"];
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var factory = new ConnectionFactory { Uri = new Uri(_connectionString) };

            using var connection = await factory.CreateConnectionAsync();
            using var channel = await connection.CreateChannelAsync();

            await channel.QueueDeclareAsync(
                queue: _queueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null
            );

            var consumer = new AsyncEventingBasicConsumer(channel);
            consumer.ReceivedAsync += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var messageJson = Encoding.UTF8.GetString(body);

                    using var scope = _serviceProvider.CreateScope();
                    var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();

                    if (messageJson.Contains("BookingId"))
                    {
                        var bookingEvent = JsonSerializer.Deserialize<BookingCreatedEvent>(messageJson);
                        await ProcessBookingNotificationAsync(hubContext, bookingEvent);
                    }
                    else if (messageJson.Contains("AccidentId"))
                    {
                        var accidentEvent = JsonSerializer.Deserialize<AccidentReportedEvent>(messageJson);
                        await ProcessAccidentNotificationAsync(hubContext, accidentEvent);
                    }

                    await channel.BasicAckAsync(ea.DeliveryTag, false);
                    _logger.LogInformation("Notification processed and sent via SignalR");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing notification message");
                }
            };

            await channel.BasicConsumeAsync(queue: _queueName, autoAck: false, consumer: consumer);
            _logger.LogInformation("Notification consumer started listening on {QueueName}", _queueName);

            await Task.Delay(Timeout.Infinite, stoppingToken);
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
                Message = $"🚨 ACCIDENT: Vehicle {accidentEvent.VehicleLicensePlate} at {accidentEvent.Location}"
            });

            _logger.LogWarning("Accident notification sent to admins for vehicle {VehicleId}", accidentEvent.VehicleId);
        }
    }
}