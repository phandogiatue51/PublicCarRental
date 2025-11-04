using StackExchange.Redis;
namespace PublicCarRental.Application.Service.Redis
{
    public interface IDistributedLockService
    {
        Task<bool> AcquireLockAsync(string key, TimeSpan expiry);
        Task ReleaseLockAsync(string key);
        bool AcquireLock(string key, TimeSpan expiry);           
        void ReleaseLock(string key);                          
        bool AcquireLock(string key, string ownerId, TimeSpan expiry);
        void ReleaseLock(string key, string expectedOwnerId);
        Task<bool> VerifyLockOwnershipAsync(string key, string expectedOwnerId);
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

        public bool AcquireLock(string key, string ownerId, TimeSpan expiry)
        {
            try
            {
                return _redis.StringSet(key, ownerId, expiry, When.NotExists);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to acquire lock for key {LockKey}", key);
                return false;
            }
        }

        public void ReleaseLock(string key, string expectedOwnerId)
        {
            try
            {
                var currentOwner = _redis.StringGet(key);
                if (currentOwner == expectedOwnerId)
                {
                    _redis.KeyDelete(key);
                    _logger.LogDebug("✅ Released lock for key {LockKey} owned by {Owner}", key, expectedOwnerId);
                }
                else
                {
                    _logger.LogWarning("🚨 Attempted to release lock for key {LockKey} owned by {CurrentOwner} but expected {ExpectedOwner}",
                        key, currentOwner, expectedOwnerId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to release lock for key {LockKey}", key);
            }
        }
        public async Task<bool> VerifyLockOwnershipAsync(string key, string expectedOwnerId)
        {
            try
            {
                var currentOwner = await _redis.StringGetAsync(key);
                return currentOwner == expectedOwnerId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to verify lock ownership for key {LockKey}", key);
                return false;
            }
        }
    }
}