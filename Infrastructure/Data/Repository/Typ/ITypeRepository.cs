using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Typ
{
    public interface ITypeRepository
    {
        IQueryable<VehicleType> GetAll();
        VehicleType GetById(int id);
    }
}
