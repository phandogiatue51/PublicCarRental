using PublicCarRental.Models;

namespace PublicCarRental.Repository.Model
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
