using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Accident
{
    public class AccidentUpdateDto
    {
        public AccidentStatus Status { get; set; }
        public string? ResolutionNote { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public ActionType? ActionTaken { get; set; }
    }
}