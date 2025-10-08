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
        public Vehicle GetFirstAvailableVehicleByModel(int modelId, int stationId, DateTime requestedStart, DateTime requestedEnd);
        public IEnumerable<StationDtoForView> GetStationFromModel(int modelId);
    }
}
