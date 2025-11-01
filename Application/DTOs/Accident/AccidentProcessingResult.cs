using PublicCarRental.Application.DTOs.BadScenario;

namespace PublicCarRental.Application.DTOs.Accident
{
    public class AccidentProcessingResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int AffectedContracts { get; set; }
        public List<ModificationResultDto> ProcessingResults { get; set; } = new();
    }
}
