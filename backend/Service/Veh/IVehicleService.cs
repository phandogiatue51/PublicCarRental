using PublicCarRental.Models;

namespace PublicCarRental.Service.Veh
{
    public interface IVehicleService
    {
        IEnumerable<Vehicle> GetAllVehicles();
        Vehicle GetVehicleById(int id);
        void CreateVehicle(Vehicle vehicle);
        bool UpdateVehicle(int id, Vehicle updatedVehicle);
        bool DeleteVehicle(int id);
    }
}
