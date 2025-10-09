using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Build.Utilities;
using PublicCarRental.Application.DTOs.Stat;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Stat;

namespace PublicCarRental.Application.Service.Stat
{
    public class StationService : BaseCachedService, IStationService
    {
        private readonly IStationRepository _repo;

        public StationService(IStationRepository repo,
                            GenericCacheDecorator cache,
                            ILogger<StationService> logger)
            : base(cache, logger)
        {
            _repo = repo;
        }

        public async Task<IEnumerable<StationDto>> GetAllAsync()
        {
            var cacheKey = CreateCacheKey("all_stations");
            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                return _repo.GetAll()
                    .Select(s => new StationDto
                    {
                        StationId = s.StationId,
                        Name = s.Name,
                        Address = s.Address,
                        Latitude = s.Latitude,
                        Longitude = s.Longitude,
                        VehicleCount = s.Vehicles != null ? s.Vehicles.Count : 0,
                        StaffCount = s.StaffMembers != null ? s.StaffMembers.Count : 0
                    }).ToList();
            }, TimeSpan.FromMinutes(15)); 
        }

        public async Task<StationDto?> GetByIdAsync(int id)
        {
            var cacheKey = CreateCacheKey("station", id);
            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                var s = _repo.GetById(id);
                if (s == null) return null;

                return new StationDto
                {
                    StationId = s.StationId,
                    Name = s.Name,
                    Address = s.Address,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,
                    VehicleCount = s.Vehicles?.Count ?? 0,
                    StaffCount = s.StaffMembers?.Count ?? 0
                };
            }, TimeSpan.FromMinutes(10));
        }

        public Station GetEntityById(int id)
        {
            return _repo.GetById(id);
        }

        public async Task<int> CreateStationAsync(StationUpdateDto dto)
        {
            var station = new Station
            {
                Name = dto.Name,
                Address = dto.Address,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude
            };
            _repo.Create(station);

            await _cache.InvalidateAsync(CreateCacheKey("all_stations"));

            return station.StationId;
        }

        public async Task<bool> UpdateStationAsync(int id, StationUpdateDto stationDto)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            existing.Name = stationDto.Name;
            existing.Address = stationDto.Address;
            existing.Latitude = stationDto.Latitude;
            existing.Longitude = stationDto.Longitude;

            _repo.Update(existing);

            // Invalidate relevant caches
            await _cache.InvalidateAsync(
                CreateCacheKey("all_stations"),
                CreateCacheKey("station", id)
            );

            return true;
        }

        public async Task<(bool Success, string Message)> DeleteStationAsync(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return (false, "Station does not exist");
            try
            {
                _repo.Delete(id);

                await _cache.InvalidateAsync(
                    CreateCacheKey("all_stations"),
                    CreateCacheKey("station", id)
                );

                return (true, "Station deleted successfully!");
            }
            catch (Exception ex)
            {
                return (false, "Could not delete this station!");
            }
        }
    }
}