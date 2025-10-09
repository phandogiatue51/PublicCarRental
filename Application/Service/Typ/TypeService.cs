using PublicCarRental.Application.DTOs;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Infrastructure.Data.Repository.Typ;

namespace PublicCarRental.Application.Service.Typ
{
    public class TypeService : BaseCachedService, ITypeService
    {
        private readonly ITypeRepository _typeRepo;

        public TypeService(ITypeRepository typeRepo, GenericCacheDecorator cache, ILogger<TypeService> logger)
            : base(cache, logger)
        {
            _typeRepo = typeRepo;
        }

        public async Task<IEnumerable<TypeDto>> GetAllTypesAsync()
        {
            var cacheKey = CreateCacheKey("all_types");
            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                return _typeRepo.GetAll()
                    .Select(type => new TypeDto
                    {
                        TypeId = type.TypeId,
                        Name = type.Name
                    }).ToList();
            }, TimeSpan.FromHours(2));
        }

        public async Task<TypeDto> GetByIdAsync(int id)
        {
            var cacheKey = CreateCacheKey("type", id);
            return await _cache.GetOrSetAsync(cacheKey, async () =>
            {
                var type = _typeRepo.GetById(id);
                if (type == null) return null;

                return new TypeDto
                {
                    TypeId = type.TypeId,
                    Name = type.Name
                };
            }, TimeSpan.FromHours(2));
        }
    }
}