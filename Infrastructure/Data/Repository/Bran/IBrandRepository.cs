using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Bran
{
    public interface IBrandRepository
    {
        IQueryable<VehicleBrand> GetAll();
        VehicleBrand GetById(int id);
        void Create(VehicleBrand brand);
        void Update(VehicleBrand brand);
        void Delete(int id);
    }
}
