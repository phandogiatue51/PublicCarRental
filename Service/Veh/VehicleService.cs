using PublicCarRental.DTOs.Stat;
using PublicCarRental.DTOs.Veh;
using PublicCarRental.Models;
using PublicCarRental.Repository.Vehi;

namespace PublicCarRental.Service.Veh
{
    public class VehicleService : IVehicleService
    {
        private readonly IVehicleRepository _repo;

        public VehicleService(IVehicleRepository repo)
        {
            _repo = repo;
        }

        public IEnumerable<VehicleDto> GetAllVehicles()
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
        }

        public VehicleDto GetById(int id)
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
        }

        public Vehicle GetFirstAvailableVehicleByModel(int modelId, int stationId, DateTime requestedStart, DateTime requestedEnd)
        => _repo.GetFirstAvailableVehicleByModel(modelId, stationId, requestedStart, requestedEnd);

        public Vehicle GetEntityById(int id)
        {
            return _repo.GetById(id);
        }

        public (bool Success, string Message, int? VehicleId) CreateVehicle(VehicleCreateDto dto)
        {
            // Check for duplicate license plate before creating
            if (_repo.Exists(v => v.LicensePlate == dto.LicensePlate))
            {
                return (false, "License plate is already registered.", null);
            }

            var vehicle = new Vehicle
            {
                LicensePlate = dto.LicensePlate,
                BatteryLevel = (int)dto.BatteryLevel,
                Status = VehicleStatus.Available,
                StationId = dto.StationId,
                ModelId = (int)dto.ModelId
            };

            try
            {
                _repo.Create(vehicle);
                return (true, "Vehicle created successfully.", vehicle.VehicleId);
            }
            catch (Exception ex)
            {
                return (false, "An error occurred while creating the vehicle.", null);
            }
        }

        public (bool Success, string Message) UpdateVehicle(int id, VehicleUpdateDto updatedVehicle)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return (false, "Vehicle not found.");

            // Check for duplicate license plate (only if license plate is being changed)
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
                return (true, "Vehicle updated successfully.");
            }
            catch (Exception ex)
            {
               
                return (false, "An error occurred while updating the vehicle.");
            }
        }

        public bool DeleteVehicle(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            _repo.Delete(id);
            return true;
        }

        public IEnumerable<StationDtoForView> GetStationFromModel(int modelId)
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
        }
    }
}
