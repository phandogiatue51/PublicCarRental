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
                    PricePerHour = v.PricePerHour,
                    StationId = v.StationId,
                    StationName = v.Station.Name,
                    ModelId = v.ModelId,
                    ModelName = v.Model.Name
                });
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
                PricePerHour = v.PricePerHour,
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

        public int CreateVehicle(VehicleCreateDto dto)
        {
            var vehicle = new Vehicle
            {
                LicensePlate = dto.LicensePlate,
                BatteryLevel = (int)dto.BatteryLevel,
                Status = VehicleStatus.Available,
                PricePerHour = (decimal)dto.PricePerHour,
                StationId = dto.StationId,
                ModelId = (int)dto.ModelId
            };
            _repo.Create(vehicle);
            return vehicle.VehicleId;
        }

        public bool UpdateVehicle(int id, VehicleUpdateDto updatedVehicle)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            existing.LicensePlate = updatedVehicle.LicensePlate;
            existing.BatteryLevel = (int)updatedVehicle.BatteryLevel;
            existing.Status = updatedVehicle.Status ?? existing.Status;
            existing.PricePerHour = (decimal)updatedVehicle.PricePerHour;
            existing.StationId = updatedVehicle.StationId;
            existing.ModelId = (int)updatedVehicle.ModelId;

            _repo.Update(existing);
            return true;
        }

        public bool DeleteVehicle(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            _repo.Delete(id);
            return true;
        }
    }
}
