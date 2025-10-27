using Microsoft.AspNetCore.Http;
using PublicCarRental.Application.DTOs.Mod;
using PublicCarRental.Application.DTOs.Stat;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Mod
{
    public interface IModelService
    {
        Task<IEnumerable<ModelDto>> GetAllModelsAsync();
        public VehicleModel GetEntityById(int id);
        Task<ModelDto> GetByIdAsync(int id);
        Task<int> CreateModelAsync(ModelCreateDto dto, IFormFile imageFile = null);
        Task<bool> UpdateModelAsync(int id, ModelCreateDto updatedModel, IFormFile newImageFile = null);
        Task<bool> DeleteModelAsync(int id);
        Task<IEnumerable<ModelDto>> GetModelsByFiltersAsync(int? brandId, int? typeId, int? stationId);

    }
}
