using PublicCarRental.Models;

namespace PublicCarRental.Repository.Vehi
{
    public interface IVehicleRepository
    {
        IEnumerable<Vehicle> GetAll();
        Vehicle GetById(int id);
        void Create(Vehicle vehicle);
        void Update(Vehicle vehicle);
        void Delete(int id);
    }
}
