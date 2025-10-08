using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Mod
{
    public interface IModelRepository
    {
        IQueryable<VehicleModel> GetAll();
        VehicleModel GetById(int id);
        void Create(VehicleModel model);
        void Update(VehicleModel model);
        void Delete(int id);
    }
}
