using PublicCarRental.DTOs.Mod;
using PublicCarRental.Models;
using PublicCarRental.Repository.Model;

namespace PublicCarRental.Service.Mod
{
    public class ModelService : IModelService
    {
        private readonly IModelRepository _repo;

        public ModelService(IModelRepository repo)
        {
            _repo = repo;
        }
        public IEnumerable<ModelDto> GetAllModels()
        {
            return _repo.GetAll()
                .Select(m => new ModelDto
                {
                    ModelId = m.ModelId,
                    Name = m.Name,
                    BrandId = m.BrandId,
                    BrandName = m.Brand?.Name,
                    TypeId = m.TypeId,
                    TypeName = m.Type?.Name
                });
        }
        public ModelDto GetById(int id)
        {
            var m = _repo.GetById(id);
            if (m == null) return null;
            return new ModelDto
            {
                ModelId = m.ModelId,
                Name = m.Name,
                BrandId = m.BrandId,
                BrandName = m.Brand?.Name,
                TypeId = m.TypeId,
                TypeName = m.Type?.Name
            };
        }
        public VehicleModel GetEntityById(int id)
        {
            return _repo.GetById(id);
        }

        public int CreateModel(ModelCreateDto dto)
        {
            var model = new VehicleModel
            {
                Name = dto.Name,
                BrandId = dto.BrandId,
                TypeId = dto.TypeId
            };
            _repo.Create(model);
            return model.ModelId;
        }

        public bool UpdateModel(int id, ModelCreateDto updatedModel)
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
