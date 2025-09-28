using PublicCarRental.DTOs.Veh;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Veh
{
    public interface IVehicleService
    {
        public IEnumerable<VehicleDto> GetAllVehicles();
        public VehicleDto GetById(int id);
        public Vehicle GetEntityById(int id);
        public Vehicle GetFirstAvailableVehicleByModel(int modelId, int stationId, DateTime requestedStart, DateTime requestedEnd);
        public int CreateVehicle(VehicleCreateDto dto);
        public bool UpdateVehicle(int id, VehicleUpdateDto updatedVehicle);
        bool DeleteVehicle(int id);
    }
}
