using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Cont
{
    public interface IContractAccidentHandler
    {
        Task HandleAffectedContracts(int damagedVehicleId, string accidentReason);
        Task<AccidentProcessingResult> ProcessApprovedAccidentAsync(int accidentId, string approvalNotes);
        Task<List<VehicleOptionDto>> GetAvailableReplacementOptions(int contractId);
        Task<ModificationResultDto> SelectReplacementVehicle(int contractId, int vehicleId, string reason);
        Task<AccidentProcessingResult> RejectAutomaticReplacementAsync(int accidentId, string reason);
        Task<List<RentalContract>> GetAffectedContractsAsync(int vehicleId);
        Task<BulkReplacementResult> SmartBulkReplaceAsync(int accidentId);
        Task<ReplacementPreviewDto> GetReplacementPreviewAsync(int accidentId);

    }
}
