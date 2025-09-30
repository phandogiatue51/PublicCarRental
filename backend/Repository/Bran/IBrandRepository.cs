using PublicCarRental.Models;

namespace PublicCarRental.Repository.Bran
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
