using StackExchange.Redis;

namespace PublicCarRental.Application.Service
{
    public class DistributedLockService
    {
        private readonly IDatabase _redis;

        public async Task<bool> AcquireLockAsync(string key, TimeSpan expiry)
        {
            return await _redis.StringSetAsync(key, "locked", expiry, When.NotExists);
        }

        public async Task ReleaseLockAsync(string key)
        {
            await _redis.KeyDeleteAsync(key);
        }
    }

    public interface IDistributedLockService
    {
        Task<bool> AcquireLockAsync(string key, TimeSpan expiry);
        Task ReleaseLockAsync(string key);
    }
}
