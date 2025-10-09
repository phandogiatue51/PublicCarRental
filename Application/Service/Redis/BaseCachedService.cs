namespace PublicCarRental.Application.Service.Redis
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
            var validParams = parameters.Where(p => p != null).ToArray();

            if (validParams.Length == 0)
            {
                return prefix.ToLowerInvariant(); 
            }

            var paramString = string.Join("_", validParams);
            return $"{prefix}_{paramString}".ToLowerInvariant();
        }
    }
}
