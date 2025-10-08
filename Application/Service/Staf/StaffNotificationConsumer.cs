using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Application.Service.Email;
using PublicCarRental.Infrastructure.Data.Models;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace PublicCarRental.Application.Service.Staf
{
    public class StaffNotificationConsumer : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly string _connectionString;
        private readonly string _queueName;
        private readonly ILogger<StaffNotificationConsumer> _logger;

        public StaffNotificationConsumer(IConfiguration configuration, IServiceProvider serviceProvider, ILogger<StaffNotificationConsumer> logger)
        {
            _serviceProvider = serviceProvider;
            _connectionString = configuration["RabbitMQ:ConnectionString"];
            _queueName = configuration["RabbitMQ:QueueNames:NotificationQueue"];
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var factory = new ConnectionFactory { Uri = new Uri(_connectionString) };

            using var connection = await factory.CreateConnectionAsync();
            using var channel = await connection.CreateChannelAsync();

            await channel.QueueDeclareAsync(queue: _queueName,
                                          durable: true,
                                          exclusive: false,
                                          autoDelete: false,
                                          arguments: null);

            var consumer = new AsyncEventingBasicConsumer(channel);
            consumer.ReceivedAsync += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var messageJson = Encoding.UTF8.GetString(body);
                    var message = JsonSerializer.Deserialize<JsonElement>(messageJson);

                    if (message.TryGetProperty("EventType", out var eventType) &&
                        eventType.GetString() == "BookingCreated")
                    {
                        var bookingEvent = JsonSerializer.Deserialize<BookingCreatedEvent>(messageJson);
                        await ProcessBookingCreatedAsync(bookingEvent);
                    }

                    await channel.BasicAckAsync(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing staff notification");
                }
            };

            await channel.BasicConsumeAsync(queue: _queueName, autoAck: false, consumer: consumer);
            _logger.LogInformation("Staff notification consumer started");

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }

        private async Task ProcessBookingCreatedAsync(BookingCreatedEvent bookingEvent)
        {
            using var scope = _serviceProvider.CreateScope();
            var staffNotificationService = scope.ServiceProvider.GetRequiredService<StaffNotificationService>();
            var emailProducer = scope.ServiceProvider.GetRequiredService<EmailProducerService>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var staffToNotify = await staffNotificationService.GetStaffToNotifyAsync(bookingEvent.StationId);
            
            foreach (var staff in staffToNotify)
            {
                await NotifyStaffMemberAsync(staff, bookingEvent, emailProducer);
            }

            await notificationService.NotifyNewBookingAsync(bookingEvent);

            _logger.LogInformation("Notified {StaffCount} staff about booking {BookingId}",
                staffToNotify.Count, bookingEvent.BookingId);
        }

        private async Task NotifyStaffMemberAsync(Staff staff, BookingCreatedEvent booking, EmailProducerService emailProducer)
        {
            var staffEmail = staff.Account?.Email;
            if (string.IsNullOrEmpty(staffEmail)) return;

            // Send email notification to staff
            var subject = $"New Booking at {booking.StationName}";
            var body = $@"
            <h2>New Booking Notification</h2>
            <p><strong>Station:</strong> {booking.StationName}</p>
            <p><strong>Customer:</strong> {booking.RenterName}</p>
            <p><strong>Vehicle:</strong> {booking.VehicleLicensePlate}</p>
            <p><strong>Time:</strong> {booking.StartTime:MMM dd, yyyy hh:mm tt} - {booking.EndTime:MMM dd, yyyy hh:mm tt}</p>
            <p><strong>Total:</strong> ${booking.TotalCost}</p>
            <p>Please prepare the vehicle for customer pickup.</p>
        ";

            var emailMessage = new EmailMessage
            {
                ToEmail = staffEmail,
                Subject = subject,
                Body = body,
                MessageType = "StaffNotification"
            };

            await emailProducer.SendStaffNotificationAsync(emailMessage);
        }
    }
}
