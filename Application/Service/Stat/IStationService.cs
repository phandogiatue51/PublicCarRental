using PublicCarRental.Application.DTOs.Stat;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Stat
{
    public interface IStationService
    {
        Task<IEnumerable<StationDto>> GetAllAsync();
        Task<StationDto?> GetByIdAsync(int id);
        Station GetEntityById(int id);
        Task<int> CreateStationAsync(StationUpdateDto dto);
        Task<bool> UpdateStationAsync(int id, StationUpdateDto stationDto);
        Task<(bool Success, string Message)> DeleteStationAsync(int id);
    }
}
