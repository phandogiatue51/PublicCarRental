using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Cont
{
    public interface IContractAccidentHandler
    {
        Task<List<VehicleOptionDto>> GetAvailableReplacementOptions(int contractId);
        Task<ModificationResultDto> SelectReplacementVehicle(int contractId, int vehicleId);
        Task<BulkReplacementResult> SmartBulkReplaceAsync(int accidentId);
        Task<ReplacementPreviewDto> GetReplacementPreviewAsync(int accidentId);
        Task<ModificationResultDto> ConfirmFirstAvailableVehicle(int contractId, string lockKey, string lockToken);
        Task<SingleContractPreviewDto> GetSingleContractPreviewAsync(int contractId);
    }
}
