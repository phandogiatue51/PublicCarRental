using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Message
{
    public class AccidentStatusUpdatedEvent
    {
        public int AccidentId { get; set; }
        public AccidentStatus NewStatus { get; set; }
        public int UpdatedByStaffId { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
