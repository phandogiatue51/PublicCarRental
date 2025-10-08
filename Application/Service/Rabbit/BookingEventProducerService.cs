using Microsoft.Extensions.Options;
using Microsoft.Extensions.Options;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Infrastructure.Data.Models.Configuration;
namespace PublicCarRental.Application.Service.Rabbit
{
    public class BookingEventProducerService
    {
        private readonly BaseMessageProducer _messageProducer;
        private readonly RabbitMQSettings _rabbitMqSettings;
        private readonly ILogger<BookingEventProducerService> _logger;

        public BookingEventProducerService(
            BaseMessageProducer messageProducer,
              IOptions<RabbitMQSettings> rabbitMqSettings, 
            ILogger<BookingEventProducerService> logger)
        {
            _messageProducer = messageProducer;
            _rabbitMqSettings = rabbitMqSettings.Value;
            _logger = logger;
        }

        public async Task PublishBookingCreatedAsync(BookingCreatedEvent bookingEvent)
        {
            await _messageProducer.PublishMessageAsync(
                bookingEvent,
                _rabbitMqSettings.QueueNames.NotificationQueue
            );
            _logger.LogInformation("BookingCreated event published for booking {BookingId}", bookingEvent.BookingId);
        }

        public async Task PublishBookingConfirmedAsync(BookingConfirmedEvent bookingEvent)
        {
            await _messageProducer.PublishMessageAsync(
                bookingEvent,
                _rabbitMqSettings.QueueNames.NotificationQueue
            );
            _logger.LogInformation("BookingConfirmed event published for booking {BookingId}", bookingEvent.BookingId);
        }
    }
}