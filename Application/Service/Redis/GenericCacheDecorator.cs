using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PublicCarRental.Application.Service.Redis
{
    public class GenericCacheDecorator
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<GenericCacheDecorator> _logger;

        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            ReferenceHandler = ReferenceHandler.IgnoreCycles, 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            WriteIndented = false
        };

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
                    _logger.LogInformation("✅ CACHE HIT for {CacheKey}", cacheKey);
                    return JsonSerializer.Deserialize<T>(cachedData, _jsonOptions); 
                }

                _logger.LogInformation("❌ CACHE MISS for {CacheKey}", cacheKey);
                var data = await dataFetchFunction();

                if (data != null)
                {
                    var options = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(5)
                    };

                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(data, _jsonOptions), options);
                    _logger.LogInformation("💾 CACHED data for {CacheKey}", cacheKey);
                }

                return data;
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "🔄 JSON serialization failed for {CacheKey}, fetching fresh data", cacheKey);
                return await dataFetchFunction();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Cache error for {CacheKey}, falling back to source", cacheKey);
                return await dataFetchFunction();
            }
        }

        public async Task InvalidateAsync(params string[] cacheKeys)
        {
            foreach (var key in cacheKeys)
            {
                await _cache.RemoveAsync(key);
                _logger.LogDebug("🗑️ Invalidated cache key: {CacheKey}", key);
            }
        }
    }
}