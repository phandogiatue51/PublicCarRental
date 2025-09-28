using PublicCarRental.Models;

namespace PublicCarRental.Repository.Typ
{
    public interface ITypeRepository
    {
        IEnumerable<VehicleType> GetAll();
        VehicleType GetById(int id);
    }
}
