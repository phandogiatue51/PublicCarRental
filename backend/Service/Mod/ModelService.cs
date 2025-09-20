using PublicCarRental.Models;
using PublicCarRental.Repository.Model;

namespace PublicCarRental.Service.Mod
{
    public class VehicleModelService : IModelService
    {
        private readonly IModelRepository _repo;

        public VehicleModelService(IModelRepository repo)
        {
            _repo = repo;
        }

        public IEnumerable<VehicleModel> GetAllModels()
        {
            return _repo.GetAll();
        }

        public VehicleModel GetModelById(int id)
        {
            return _repo.GetById(id);
        }

        public void CreateModel(VehicleModel model)
        {
            _repo.Create(model);
        }

        public bool UpdateModel(int id, VehicleModel updatedModel)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            existing.Name = updatedModel.Name;
            existing.BrandId = updatedModel.BrandId;
            existing.TypeId = updatedModel.TypeId;
            _repo.Update(existing);
            return true;
        }

        public bool DeleteModel(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            _repo.Delete(id);
            return true;
        }
    }
}
