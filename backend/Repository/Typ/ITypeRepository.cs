using PublicCarRental.Models;

namespace PublicCarRental.Repository.Typ
{
    public interface ITypeRepository
    {
        IQueryable<VehicleType> GetAll();
        VehicleType GetById(int id);
    }
}
