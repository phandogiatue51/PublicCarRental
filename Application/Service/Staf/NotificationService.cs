using Microsoft.AspNetCore.SignalR;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Infrastructure.Signal;

namespace PublicCarRental.Application.Service.Staf
{
    public interface INotificationService
    {
        Task NotifyNewBookingAsync(BookingCreatedEvent bookingEvent);
        Task NotifyBookingConfirmedAsync(BookingConfirmedEvent bookingEvent);
    }

    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(IHubContext<NotificationHub> hubContext, ILogger<NotificationService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        private object CreateNotificationPayload(string type, string message, object booking)
        {
            return new
            {
                type,
                message,
                booking,
                timestamp = DateTime.UtcNow
            };
        }

        public async Task NotifyNewBookingAsync(BookingCreatedEvent bookingEvent)
        {
            var staffMessage = $"New booking at {bookingEvent.StationName}";
            var adminMessage = $"New booking created - Station: {bookingEvent.StationName}";

            try
            {
                var payloadForStaff = CreateNotificationPayload("NEW_BOOKING", staffMessage, bookingEvent);
                var payloadForAdmin = CreateNotificationPayload("NEW_BOOKING", adminMessage, bookingEvent);

                await _hubContext.Clients.Group($"station-{bookingEvent.StationId}")
                    .SendAsync("ReceiveBookingNotification", payloadForStaff);

                await _hubContext.Clients.Group("admin")
                    .SendAsync("ReceiveBookingNotification", payloadForAdmin);

                _logger.LogInformation("Sent NEW_BOOKING notification for BookingId: {BookingId}", bookingEvent.BookingId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending NEW_BOOKING notification for BookingId: {BookingId}", bookingEvent.BookingId);
            }
        }

        public async Task NotifyBookingConfirmedAsync(BookingConfirmedEvent bookingEvent)
        {
            var message = $"Booking confirmed - {bookingEvent.RenterName}";
            var payload = CreateNotificationPayload("BOOKING_CONFIRMED", message, bookingEvent);

            try
            {
                await _hubContext.Clients.Group("admin")
                    .SendAsync("ReceiveBookingNotification", payload);

                _logger.LogInformation("Sent BOOKING_CONFIRMED notification for BookingId: {BookingId}", bookingEvent.BookingId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending BOOKING_CONFIRMED notification for BookingId: {BookingId}", bookingEvent.BookingId);
            }
        }
    }
}
