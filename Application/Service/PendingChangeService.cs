using PublicCarRental.Application.DTOs.Pay;
using System.Collections.Concurrent;

namespace PublicCarRental.Application.Service
{
    public interface IPendingChangeService
    {
        Task<PendingModificationDto> GetByInvoiceIdAsync(int invoiceId);
        Task<PendingModificationDto> AddAsync(PendingModificationDto modification);
        Task<bool> RemoveAsync(int invoiceId);
    }

    public class PendingChangeService : IPendingChangeService
    {
        private readonly ConcurrentDictionary<int, PendingModificationDto> _pendingChanges = new();
        private readonly ILogger<PendingChangeService> _logger;

        public PendingChangeService(ILogger<PendingChangeService> logger)
        {
            _logger = logger;
        }

        public Task<PendingModificationDto> GetByInvoiceIdAsync(int invoiceId)
        {
            _pendingChanges.TryGetValue(invoiceId, out var modification);
            return Task.FromResult(modification);
        }

        public Task<PendingModificationDto> AddAsync(PendingModificationDto modification)
        {
            _pendingChanges[modification.InvoiceId] = modification;
            _logger.LogInformation($"📝 Added pending modification for invoice {modification.InvoiceId}");
            return Task.FromResult(modification);
        }

        public Task<bool> RemoveAsync(int invoiceId)
        {
            var removed = _pendingChanges.TryRemove(invoiceId, out _);
            _logger.LogInformation($"🗑️ Removed pending modification for invoice {invoiceId}: {removed}");
            return Task.FromResult(removed);
        }
    }
}