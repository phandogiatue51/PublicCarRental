using Microsoft.Extensions.Caching.Distributed;
using PublicCarRental.Application.DTOs.Pay;
using System.Text.Json;

namespace PublicCarRental.Application.Service
{
    public class RedisPendingChangeService : IPendingChangeService
    {
        private readonly IDistributedCache _redis;
        private readonly ILogger<RedisPendingChangeService> _logger;
        private readonly TimeSpan _defaultExpiration = TimeSpan.FromHours(24);

        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        public RedisPendingChangeService(IDistributedCache redis, ILogger<RedisPendingChangeService> logger)
        {
            _redis = redis;
            _logger = logger;
        }

        public async Task<PendingModificationDto> GetByInvoiceIdAsync(int invoiceId)
        {
            var cacheKey = $"pending:invoice:{invoiceId}";
            try
            {
                var cachedData = await _redis.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    _logger.LogInformation("✅ Found pending modification for invoice {InvoiceId}", invoiceId);
                    return JsonSerializer.Deserialize<PendingModificationDto>(cachedData, _jsonOptions);
                }

                _logger.LogDebug("❌ No pending modification found for invoice {InvoiceId}", invoiceId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Redis error getting pending change for invoice {InvoiceId}", invoiceId);
                return null;
            }
        }

        public async Task<PendingModificationDto> AddAsync(PendingModificationDto modification)
        {
            var cacheKey = $"pending:invoice:{modification.InvoiceId}";
            try
            {
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = _defaultExpiration
                };

                var jsonData = JsonSerializer.Serialize(modification, _jsonOptions);
                await _redis.SetStringAsync(cacheKey, jsonData, options);

                _logger.LogInformation("📝 Added pending modification for invoice {InvoiceId}, contract {ContractId}",
                    modification.InvoiceId, modification.ContractId);

                return modification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Redis error adding pending change for invoice {InvoiceId}", modification.InvoiceId);
                throw;
            }
        }

        public async Task<bool> RemoveAsync(int invoiceId)
        {
            var cacheKey = $"pending:invoice:{invoiceId}";
            try
            {
                await _redis.RemoveAsync(cacheKey);
                _logger.LogInformation("🗑️ Removed pending modification for invoice {InvoiceId}", invoiceId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Redis error removing pending change for invoice {InvoiceId}", invoiceId);
                return false;
            }
        }
    }

    public interface IPendingChangeService
    {
        Task<PendingModificationDto> GetByInvoiceIdAsync(int invoiceId);
        Task<PendingModificationDto> AddAsync(PendingModificationDto modification);
        Task<bool> RemoveAsync(int invoiceId);

    }
}