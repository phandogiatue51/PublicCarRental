using StackExchange.Redis;
namespace PublicCarRental.Application.Service
{
    public interface IDistributedLockService
    {
        Task<bool> AcquireLockAsync(string key, TimeSpan expiry);
        Task ReleaseLockAsync(string key);
        bool AcquireLock(string key, TimeSpan expiry);
        void ReleaseLock(string key);
    }

    public class DistributedLockService : IDistributedLockService
    {
        private readonly IDatabase _redis;
        private readonly ILogger<DistributedLockService> _logger;

        public DistributedLockService(IConnectionMultiplexer redis, ILogger<DistributedLockService> logger)
        {
            _redis = redis.GetDatabase();
            _logger = logger;
        }

        public async Task<bool> AcquireLockAsync(string key, TimeSpan expiry)
        {
            try
            {
                return await _redis.StringSetAsync(key, "locked", expiry, When.NotExists);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to acquire lock for key {LockKey}", key);
                return false;
            }
        }

        public async Task ReleaseLockAsync(string key)
        {
            try
            {
                await _redis.KeyDeleteAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to release lock for key {LockKey}", key);
            }
        }

        public bool AcquireLock(string key, TimeSpan expiry)
        {
            try
            {
                return _redis.StringSet(key, "locked", expiry, When.NotExists);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to acquire lock for key {LockKey}", key);
                return false;
            }
        }

        public void ReleaseLock(string key)
        {
            try
            {
                _redis.KeyDelete(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to release lock for key {LockKey}", key);
            }
        }
    }
}