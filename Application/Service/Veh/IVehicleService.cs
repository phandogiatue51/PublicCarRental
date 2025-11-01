using PublicCarRental.Application.DTOs.Stat;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Veh
{
    public interface IVehicleService
    {
        Task<IEnumerable<VehicleDto>> GetAllVehiclesAsync();
        Task<VehicleDto> GetByIdAsync(int id);
        public Vehicle GetEntityById(int id);
        Task<IEnumerable<VehicleFilter>> GetVehiclesByFiltersAsync(int? modelId, int? status, int? stationId, int? typeId, int? brandId);
        Task<(bool Success, string Message, int? VehicleId)> CreateVehicleAsync(VehicleCreateDto dto);
        Task<(bool Success, string Message)> UpdateVehicleAsync(int id, VehicleUpdateDto updatedVehicle);
        Task<bool> DeleteVehicleAsync(int id);
        Task<bool> CheckVehicleAvailabilityAsync(int vehicleId, DateTime startTime, DateTime endTime);
        Task<Vehicle> GetFirstAvailableVehicleByModelAsync(int modelId, int stationId, DateTime startTime, DateTime endTime, int? excludeVehicleId = null);
        Task<int> GetAvailableVehicleCountByModelAsync(int modelId, int stationId, DateTime startTime, DateTime endTime);
        Task<IEnumerable<StationDtoForView>> GetStationFromModelAsync(int modelId);
        Task<List<VehicleDto>> GetAvailableAsync(DateTime? startTime = null, DateTime? endTime = null, int? stationId = null);
        Task<List<Vehicle>> GetAvailableVehiclesByModelAsync(int modelId, int stationId, DateTime startTime, DateTime endTime, int? excludeVehicleId = null);
    }
}
