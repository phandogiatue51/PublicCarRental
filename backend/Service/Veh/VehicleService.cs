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

        public IEnumerable<Vehicle> GetAllVehicles()
        {
            return _repo.GetAll();
        }

        public Vehicle GetVehicleById(int id)
        {
            return _repo.GetById(id);
        }

        public void CreateVehicle(Vehicle vehicle)
        {
            _repo.Create(vehicle);
        }

        public bool UpdateVehicle(int id, Vehicle updatedVehicle)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            existing.LicensePlate = updatedVehicle.LicensePlate;
            existing.BatteryLevel = updatedVehicle.BatteryLevel;
            existing.Status = updatedVehicle.Status;
            existing.PricePerHour = updatedVehicle.PricePerHour;
            existing.StationId = updatedVehicle.StationId;
            existing.ModelId = updatedVehicle.ModelId;

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
