using PublicCarRental.Application.DTOs.Bran;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Bran;

namespace PublicCarRental.Application.Service.Bran
{
    public class BrandService : BaseCachedService, IBrandService
    {
        private readonly IBrandRepository _repo;

        public BrandService(IBrandRepository repo, GenericCacheDecorator cache, ILogger<BrandService> logger)
            : base(cache, logger)
        {
            _repo = repo;
        }

        public async Task<IEnumerable<BrandDto>> GetAllAsync()
        {
            var cacheKey = CreateCacheKey("all_brands");
            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                return _repo.GetAll()
                    .Select(b => new BrandDto
                    {
                        BrandId = b.BrandId,
                        Name = b.Name
                    }).ToList();
            }, TimeSpan.FromHours(2)); 
        }

        public async Task<BrandDto?> GetByIdAsync(int id)
        {
            var cacheKey = CreateCacheKey("brand", id);
            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                var brand = _repo.GetById(id);
                if (brand == null) return null;

                return new BrandDto
                {
                    BrandId = brand.BrandId,
                    Name = brand.Name
                };
            }, TimeSpan.FromHours(2));
        }

        public async Task<int> CreateBrandAsync(BrandUpdateDto dto)
        {
            var brand = new VehicleBrand
            {
                Name = dto.Name
            };
            _repo.Create(brand);

            await _cache.InvalidateAsync(CreateCacheKey("all_brands"));

            return brand.BrandId;
        }

        public async Task<bool> UpdateBrandAsync(int id, BrandUpdateDto updatedBrand)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            existing.Name = updatedBrand.Name;
            _repo.Update(existing);

            await _cache.InvalidateAsync(
                CreateCacheKey("all_brands"),
                CreateCacheKey("brand", id)
            );

            return true;
        }

        public async Task<bool> DeleteBrandAsync(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            _repo.Delete(id);

            await _cache.InvalidateAsync(
                CreateCacheKey("all_brands"),
                CreateCacheKey("brand", id)
            );

            return true;
        }
    }
}