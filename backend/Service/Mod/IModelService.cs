using PublicCarRental.Models;

namespace PublicCarRental.Service
{
    public interface IModelService
    {
        IEnumerable<VehicleModel> GetAllModels();
        VehicleModel GetModelById(int id);
        void CreateModel(VehicleModel model);
        bool UpdateModel(int id, VehicleModel updatedModel);
        bool DeleteModel(int id);
    }
}
