namespace PublicCarRental.Service.Redis
{
    public abstract class BaseCachedService
    {
        protected readonly GenericCacheDecorator _cache;
        protected readonly ILogger _logger;

        protected BaseCachedService(GenericCacheDecorator cache, ILogger logger)
        {
            _cache = cache;
            _logger = logger;
        }

        protected virtual string CreateCacheKey(string prefix, params object[] parameters)
        {
            var paramString = string.Join("_", parameters.Where(p => p != null));
            return $"{prefix}_{paramString}".ToLowerInvariant();
        }
    }
}
