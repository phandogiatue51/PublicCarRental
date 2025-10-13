using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs.Mod;
using PublicCarRental.Application.DTOs.Stat;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Application.Service.Mod;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Mod;

public class ModelService : BaseCachedService, IModelService
{
    private readonly IModelRepository _repo;
    private readonly IImageStorageService _imageStorageService;

    public ModelService(IModelRepository repo,GenericCacheDecorator cache, 
        ILogger<ModelService> logger, IImageStorageService imageStorageService) : base(cache, logger)
    {
        _repo = repo;
        _imageStorageService = imageStorageService;
    }

    public async Task<IEnumerable<ModelDto>> GetAllModelsAsync()
    {
        var cacheKey = CreateCacheKey("all_models");
        return await _cache.GetOrSetAsync(cacheKey, async () =>
        {
            return _repo.GetAll()
                .Select(m => new ModelDto
                {
                    ModelId = m.ModelId,
                    Name = m.Name,
                    BrandId = m.BrandId,
                    BrandName = m.Brand != null ? m.Brand.Name : null,
                    TypeId = m.TypeId,
                    TypeName = m.Type != null ? m.Type.Name : null,
                    PricePerHour = m.PricePerHour,
                    ImageUrl = m.ImageUrl
                })
                .ToList();
        }, TimeSpan.FromMinutes(30));
    }

    public async Task<ModelDto> GetByIdAsync(int id)
    {
        var cacheKey = CreateCacheKey("model", id);
        return await _cache.GetOrSetAsync(cacheKey, async () =>
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
                TypeName = m.Type?.Name,
                PricePerHour = m.PricePerHour,
                ImageUrl = m.ImageUrl
            };
        }, TimeSpan.FromMinutes(30)); 
    }

    public VehicleModel GetEntityById(int id)
    {
        return _repo.GetById(id);
    }

    public async Task<int> CreateModelAsync(ModelCreateDto dto, IFormFile imageFile = null)
    {
        var model = new VehicleModel
        {
            Name = dto.Name,
            BrandId = dto.BrandId,
            TypeId = dto.TypeId,
            PricePerHour = dto.PricePerHour,
        };

        if (imageFile != null && imageFile.Length > 0)
        {
            model.ImageUrl = await _imageStorageService.UploadImageAsync(imageFile);
        }

        _repo.Create(model);

        await _cache.InvalidateAsync(
           CreateCacheKey("all_models"),
           CreateCacheKey("models_filter_*")
       );
        return model.ModelId;
    }

    public async Task<bool> UpdateModelAsync(int id, ModelCreateDto updatedModel, IFormFile newImageFile = null)
    {
        var existing = _repo.GetById(id);
        if (existing == null) return false;

        existing.Name = updatedModel.Name;
        existing.BrandId = updatedModel.BrandId;
        existing.TypeId = updatedModel.TypeId;
        existing.PricePerHour = updatedModel.PricePerHour;

        if (newImageFile != null && newImageFile.Length > 0)
        {
            existing.ImageUrl = await _imageStorageService.UpdateImageAsync(
                existing.ImageUrl,
                newImageFile);
        }

        _repo.Update(existing);

        await _cache.InvalidateAsync(
            CreateCacheKey("all_models"),
            CreateCacheKey("models_filter_*"),
            CreateCacheKey("model", id)
        );

        return true;
    }

    public async Task<bool> DeleteModelAsync(int id)
    {
        var existing = _repo.GetById(id);
        if (existing == null) return false;

        _repo.Delete(id);

        await _cache.InvalidateAsync(
        CreateCacheKey("all_models"),
        CreateCacheKey("models_filter_*"),
        CreateCacheKey("model", id)
        );

        return true;
    }

    public bool DeleteModel(int id)
        => DeleteModelAsync(id).GetAwaiter().GetResult();

    public async Task<IEnumerable<ModelDto>> GetModelsByFiltersAsync(int? brandId, int? typeId, int? stationId)
    {
        var cacheKey = CreateCacheKey("models_filter", brandId, typeId, stationId);
        return await _cache.GetOrSetAsync(cacheKey, async () =>
        {
            return _repo.GetAll()
                .Where(m => !brandId.HasValue || m.BrandId == brandId.Value)
                .Where(m => !typeId.HasValue || m.TypeId == typeId.Value)
                .Where(m => !stationId.HasValue || m.Vehicles.Any(v =>
                    v.StationId == stationId.Value &&
                    v.Status == VehicleStatus.Available))
                .Select(m => new ModelDto
                {
                    ModelId = m.ModelId,
                    Name = m.Name,
                    BrandId = m.BrandId,
                    BrandName = m.Brand.Name,
                    TypeId = m.TypeId,
                    TypeName = m.Type.Name,
                    PricePerHour = m.PricePerHour,
                    ImageUrl = m.ImageUrl
                }).ToList();
        }, TimeSpan.FromMinutes(10));
    }

    public IEnumerable<ModelDto> GetModelsByFilters(int? brandId, int? typeId, int? stationId)
        => GetModelsByFiltersAsync(brandId, typeId, stationId).GetAwaiter().GetResult();

    public async Task<IEnumerable<StationDtoForView>> GetStationsByModelAsync(int modelId)
    {
        var cacheKey = CreateCacheKey("stations_by_model", modelId);
        return await _cache.GetOrSetAsync(cacheKey, async () =>
        {
            var model = _repo.GetAll()
                .Include(m => m.Vehicles)
                .ThenInclude(v => v.Station)
                .FirstOrDefault(m => m.ModelId == modelId);

            if (model == null)
                return Enumerable.Empty<StationDtoForView>();

            return model.Vehicles
                .Where(v => v.Status == VehicleStatus.Available)
                .GroupBy(v => v.Station)
                .Select(g => new StationDtoForView
                {
                    Name = g.Key.Name,
                    Address = g.Key.Address,
                    Latitude = g.Key.Latitude,
                    Longitude = g.Key.Longitude,
                }).ToList();
        }, TimeSpan.FromMinutes(15));
    }
}