using Microsoft.AspNetCore.Http;
using PublicCarRental.DTOs.Mod;
using PublicCarRental.DTOs.Stat;
using PublicCarRental.Models;

namespace PublicCarRental.Service
{
    public interface IModelService
    {
        Task<IEnumerable<ModelDto>> GetAllModelsAsync();
        public VehicleModel GetEntityById(int id);
        public ModelDto GetById(int id);
        Task<int> CreateModelAsync(ModelCreateDto dto, IFormFile imageFile = null);
        Task<bool> UpdateModelAsync(int id, ModelCreateDto updatedModel, IFormFile newImageFile = null);
        bool DeleteModel(int id);
        Task<IEnumerable<ModelDto>> GetModelsByFiltersAsync(int? brandId, int? typeId, int? stationId);
        public IEnumerable<StationDtoForView> GetStationsByModel(int modelId);


    }
}
