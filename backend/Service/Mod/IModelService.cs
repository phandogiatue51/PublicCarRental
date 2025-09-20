using PublicCarRental.DTOs.Mod;
using PublicCarRental.Models;

namespace PublicCarRental.Service
{
    public interface IModelService
    {
        public IEnumerable<ModelDto> GetAllModels();
        public VehicleModel GetEntityById(int id);
        public ModelDto GetById(int id);
        public int CreateModel(ModelCreateDto dto);
        public bool UpdateModel(int id, ModelCreateDto updatedModel);
        bool DeleteModel(int id);
    }
}
