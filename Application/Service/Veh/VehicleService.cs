using PublicCarRental.Application.DTOs.Stat;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Vehi;

namespace PublicCarRental.Application.Service.Veh
{
    public class VehicleService : BaseCachedService, IVehicleService
    {
        private readonly IVehicleRepository _repo;

        public VehicleService(IVehicleRepository repo,
                            GenericCacheDecorator cache,
                            ILogger<VehicleService> logger)
            : base(cache, logger)
        {
            _repo = repo;
        }

        public async Task<IEnumerable<VehicleDto>> GetAllVehiclesAsync()
        {
            var cacheKey = CreateCacheKey("all_vehicles");
            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                return _repo.GetAll()
                    .Select(v => new VehicleDto
                    {
                        VehicleId = v.VehicleId,
                        LicensePlate = v.LicensePlate,
                        BatteryLevel = v.BatteryLevel,
                        Status = v.Status,
                        StationId = v.StationId,
                        StationName = v.Station.Name,
                        ModelId = v.ModelId,
                        ModelName = v.Model.Name
                    }).ToList();
            }, TimeSpan.FromMinutes(5));
        }

        public async Task<VehicleDto> GetByIdAsync(int id)
        {
            var cacheKey = CreateCacheKey("vehicle", id);
            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                var v = _repo.GetById(id);
                if (v == null) return null;

                return new VehicleDto
                {
                    VehicleId = v.VehicleId,
                    LicensePlate = v.LicensePlate,
                    BatteryLevel = v.BatteryLevel,
                    Status = v.Status,
                    StationId = v.StationId,
                    StationName = v.Station.Name,
                    ModelId = v.ModelId,
                    ModelName = v.Model.Name
                };
            }, TimeSpan.FromMinutes(10));
        }

        public async Task<IEnumerable<VehicleFilter>> GetVehiclesByFiltersAsync(int? modelId, int? status, int? stationId, int? typeId, int? brandId)
        {
            var cacheKey = CreateCacheKey("vehicles_filter", modelId, status, stationId, typeId, brandId);

            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                var query = _repo.GetAll().AsQueryable();

                if (modelId.HasValue)
                    query = query.Where(v => v.ModelId == modelId.Value);

                if (status.HasValue)
                    query = query.Where(v => (int)v.Status == status.Value);

                if (stationId.HasValue)
                    query = query.Where(v => v.StationId == stationId.Value);

                if (typeId.HasValue)
                    query = query.Where(v => v.Model.TypeId == typeId.Value);

                if (brandId.HasValue)
                    query = query.Where(v => v.Model.BrandId == brandId.Value);

                return query.Select(v => new VehicleFilter
                {
                    VehicleId = v.VehicleId,
                    LicensePlate = v.LicensePlate,
                    BatteryLevel = v.BatteryLevel,
                    Status = v.Status,
                    StationId = v.StationId,
                    StationName = v.Station.Name,
                    ModelId = v.ModelId,
                    ModelName = v.Model.Name,
                    BrandId = v.Model.BrandId,
                    BrandName = v.Model.Brand.Name,
                    TypeId = v.Model.TypeId,
                    TypeName = v.Model.Type.Name,
                    PricePerHour = v.Model.PricePerHour,
                    ImageUrl = v.Model.ImageUrl
                }).ToList();
            }, TimeSpan.FromMinutes(3)); 
        }

        public async Task<(bool Success, string Message, int? VehicleId)> CreateVehicleAsync(VehicleCreateDto dto)
        {
            if (_repo.Exists(v => v.LicensePlate == dto.LicensePlate))
            {
                return (false, "License plate is already registered.", null);
            }

            var vehicle = new Vehicle
            {
                LicensePlate = dto.LicensePlate,
                BatteryLevel = dto.BatteryLevel,
                Status = VehicleStatus.Available,
                StationId = dto.StationId,
                ModelId = dto.ModelId
            };

            try
            {
                _repo.Create(vehicle);

                await _cache.InvalidateAsync(
                    CreateCacheKey("all_vehicles"),
                    CreateCacheKey("vehicle", vehicle.VehicleId),
                    CreateCacheKey("vehicles_filter_*"),
                    CreateCacheKey("stations_by_model_*"),    
                    CreateCacheKey("available_vehicle_*")     
                );

                return (true, "Vehicle created successfully.", vehicle.VehicleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating vehicle");
                return (false, "An error occurred while creating the vehicle.", null);
            }
        }

        public async Task<(bool Success, string Message)> UpdateVehicleAsync(int id, VehicleUpdateDto updatedVehicle)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return (false, "Vehicle not found.");

            if (existing.LicensePlate != updatedVehicle.LicensePlate &&
                _repo.Exists(v => v.VehicleId != id && v.LicensePlate == updatedVehicle.LicensePlate))
            {
                return (false, "License plate is already registered to another vehicle.");
            }

            existing.LicensePlate = updatedVehicle.LicensePlate;
            existing.BatteryLevel = (int)updatedVehicle.BatteryLevel;
            existing.Status = updatedVehicle.Status ?? existing.Status;
            existing.StationId = updatedVehicle.StationId;
            existing.ModelId = (int)updatedVehicle.ModelId;

            try
            {
                _repo.Update(existing);

                await _cache.InvalidateAsync(
                    CreateCacheKey("all_vehicles"),
                    CreateCacheKey("vehicle", id),
                    CreateCacheKey("vehicles_filter_*"),
                    CreateCacheKey("stations_by_model_*"),
                    CreateCacheKey("available_vehicle_*")
                );

                return (true, "Vehicle updated successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vehicle {VehicleId}", id);
                return (false, "An error occurred while updating the vehicle.");
            }
        }

        public async Task<bool> DeleteVehicleAsync(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            _repo.Delete(id);

            await _cache.InvalidateAsync(
                CreateCacheKey("all_vehicles"),
                CreateCacheKey("vehicle", id),
                CreateCacheKey("vehicles_filter_*"),
                CreateCacheKey("stations_by_model_*"),
                CreateCacheKey("available_vehicle_*")
            );
            return true;
        }

        public async Task<Vehicle> GetFirstAvailableVehicleByModelAsync(int modelId, int stationId, DateTime requestedStart, DateTime requestedEnd)
        {

                return await _repo.GetFirstAvailableVehicleByModelAsync(modelId, stationId, requestedStart, requestedEnd);
        }

        public async Task<bool> CheckVehicleAvailabilityAsync(int vehicleId, DateTime startTime, DateTime endTime)
        {
            return await _repo.CheckVehicleAvailabilityAsync(vehicleId, startTime, endTime);
        }

        public Vehicle GetEntityById(int id) => _repo.GetById(id);

        public async Task<IEnumerable<StationDtoForView>> GetStationFromModelAsync(int modelId)
        {
            var cacheKey = CreateCacheKey("stations_by_model", modelId);

            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                return _repo.GetAll()
                    .Where(v => v.ModelId == modelId)
                    .Where(v => v.Station != null)
                    .Select(v => new StationDtoForView
                    {
                        Name = v.Station.Name,
                        Address = v.Station.Address,
                        Latitude = v.Station.Latitude,
                        Longitude = v.Station.Longitude
                    })
                    .Distinct()
                    .ToList();
            }, TimeSpan.FromMinutes(15)); 
        }
    }
}