using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace PublicCarRental.Service
{
    public class GenericCacheDecorator
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<GenericCacheDecorator> _logger;

        public GenericCacheDecorator(IDistributedCache cache, ILogger<GenericCacheDecorator> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public async Task<T> GetOrSetAsync<T>(string cacheKey, Func<Task<T>> dataFetchFunction, TimeSpan? expiration = null)
        {
            try
            {
                var cachedData = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    _logger.LogDebug("Cache hit for {CacheKey}", cacheKey);
                    return JsonSerializer.Deserialize<T>(cachedData);
                }

                _logger.LogDebug("Cache miss for {CacheKey}", cacheKey);
                var data = await dataFetchFunction();

                if (data != null)
                {
                    var options = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(5)
                    };
                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(data), options);
                }

                return data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cache error for {CacheKey}, falling back to source", cacheKey);
                return await dataFetchFunction();
            }
        }

        public async Task InvalidateAsync(params string[] cacheKeys)
        {
            foreach (var key in cacheKeys)
            {
                await _cache.RemoveAsync(key);
                _logger.LogDebug("Invalidated cache key: {CacheKey}", key);
            }
        }
    }
}
