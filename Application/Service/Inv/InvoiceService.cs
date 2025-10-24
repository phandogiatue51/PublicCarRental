using PublicCarRental.Application.DTOs.Inv;
using PublicCarRental.Application.Service.Trans;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Inv;

namespace PublicCarRental.Application.Service.Inv
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _repo;
        private readonly ITransactionService _transactionService;
        private readonly ILogger<InvoiceService> _logger;


        public InvoiceService(IInvoiceRepository repo, ITransactionService transactionService, 
            ILogger<InvoiceService> logger)
        {
            _repo = repo;
            _transactionService = transactionService;
            _logger = logger;
        }

        public IEnumerable<InvoiceDto> GetAll()
        {
            return _repo.GetAll()
                .Select(i => new InvoiceDto
                {
                    InvoiceId = i.InvoiceId,
                    ContractId = i.ContractId,
                    IssuedAt = i.IssuedAt,
                    AmountDue = i.AmountDue,
                    AmountPaid = i.AmountPaid,
                    PaidAt = i.PaidAt,
                    Status = i.Status,
                    OrderCode = i.OrderCode,
                    Note = i.Note
                }).ToList();
        }

        public InvoiceDto GetById(int id)
        {
            var i = _repo.GetById(id);
            if (i == null) return null;
            return new InvoiceDto
            {
                InvoiceId = i.InvoiceId,
                ContractId = i.ContractId,
                IssuedAt = i.IssuedAt,
                AmountDue = i.AmountDue,
                AmountPaid = i.AmountPaid,
                PaidAt = i.PaidAt,
                Status = i.Status,
                OrderCode = i.OrderCode,
                Note = i.Note
            };
        }

        public InvoiceDto GetByOrderCode(int orderCode)
        {
            var i = _repo.GetAll().FirstOrDefault(x => x.OrderCode == orderCode);
            if (i == null) return null;
            return new InvoiceDto
            {
                InvoiceId = i.InvoiceId,
                ContractId = i.ContractId,
                IssuedAt = i.IssuedAt,
                AmountDue = i.AmountDue,
                AmountPaid = i.AmountPaid,
                PaidAt = i.PaidAt,
                OrderCode = i.OrderCode,
                Status = i.Status,
                Note = i.Note
            };
        }

        public InvoiceDto GetByContractId(int contractId)
        {
            var i = _repo.GetAll().FirstOrDefault(x => x.ContractId == contractId);
            if (i == null) return null;
            return new InvoiceDto
            {
                InvoiceId = i.InvoiceId,
                ContractId = i.ContractId,
                IssuedAt = i.IssuedAt,
                AmountDue = i.AmountDue,
                AmountPaid = i.AmountPaid,
                PaidAt = i.PaidAt,
                Status = i.Status,
                OrderCode = i.OrderCode,
                Note = i.Note
            };
        }

        public Invoice GetEntityById(int id)
        {
            return _repo.GetById(id);
        }

        public bool UpdateInvoice(Invoice invoice)
        {
            _repo.Update(invoice);
            return true;
        }

        public IEnumerable<InvoiceDto> GetInvoiceByRenterId(int renterId)
        {
            var invoices = _repo.GetAll()
                .Where(i => i.Contract.EVRenter.RenterId == renterId)
                .ToList();
            return invoices.Select(i => new InvoiceDto
            {
                InvoiceId = i.InvoiceId,
                ContractId = i.ContractId,
                IssuedAt = i.IssuedAt,
                AmountDue = i.AmountDue,
                AmountPaid = i.AmountPaid,
                PaidAt = i.PaidAt,
                Status = i.Status,
                OrderCode = i.OrderCode,
                Note = i.Note
            });
        }
        public Invoice GetInvoiceByOrderCode(int orderCode)
        {
            return _repo.GetAll().FirstOrDefault(i => i.OrderCode == orderCode);
        }

        public bool UpdateInvoiceStatus(int invoiceId, InvoiceStatus status, decimal amountPaid = 0)
        {
            try
            {
                var invoice = _repo.GetById(invoiceId);
                if (invoice == null)
                {
                    _logger.LogWarning("Invoice {InvoiceId} not found for status update", invoiceId);
                    return false;
                }

                _logger.LogInformation("Updating invoice {InvoiceId} from status {OldStatus} to {NewStatus}",
                    invoiceId, invoice.Status, status);

                invoice.Status = status;

                if (status == InvoiceStatus.Paid)
                {
                    invoice.PaidAt = DateTime.UtcNow;
                    invoice.AmountPaid = amountPaid > 0 ? amountPaid : invoice.AmountDue;

                    _logger.LogInformation("Invoice {InvoiceId} - AmountPaid: {AmountPaid}, ContractId: {ContractId}",
                        invoiceId, invoice.AmountPaid, invoice.ContractId);

                    if (invoice.ContractId.HasValue)
                    {
                        try
                        {
                            _transactionService.CreateTransaction(invoice.ContractId.Value);
                            _logger.LogInformation("Transaction created for contract {ContractId}",
                                invoice.ContractId.Value);
                        }
                        catch (Exception transEx)
                        {
                            _logger.LogError(transEx, "Failed to create transaction for contract {ContractId}",
                                invoice.ContractId.Value);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Invoice {InvoiceId} has no ContractId associated", invoiceId);
                    }
                }
                else if (status == InvoiceStatus.Cancelled)
                {
                    _logger.LogInformation("Invoice {InvoiceId} marked as cancelled", invoiceId);
                }

                _repo.Update(invoice);
                _logger.LogInformation("Successfully updated invoice {InvoiceId} to status {NewStatus}",
                    invoiceId, status);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating invoice {InvoiceId} status to {NewStatus}",
                    invoiceId, status);
                return false;
            }
        }

        public IEnumerable<InvoiceDto> GetInvoiceByStationId(int stationId)
        {
            var invoices = _repo.GetAll()
                .Where(i => i.Contract.Vehicle.StationId == stationId)
                .ToList();
            return invoices.Select(i => new InvoiceDto
            {
                InvoiceId = i.InvoiceId,
                ContractId = i.ContractId,
                IssuedAt = i.IssuedAt,
                AmountDue = i.AmountDue,
                AmountPaid = i.AmountPaid,
                PaidAt = i.PaidAt,
                Status = i.Status,
                OrderCode = i.OrderCode,
                Note = i.Note
            });
        }

        public bool DeleteInvoice(Invoice invoice)
        {
            _repo.Delete(invoice);
            return true;
        }

        public async Task<Invoice> CreateAdditionalInvoiceAsync(int contractId, decimal amount, string note)
        {
            try
            {
                var invoice = new Invoice
                {
                    ContractId = contractId,
                    AmountDue = amount,
                    IssuedAt = DateTime.UtcNow,
                    Status = InvoiceStatus.Pending,
                    Note = note,
                    OrderCode = GenerateOrderCode() // You might need a different order code generation
                };

                _repo.Create(invoice);
                _logger.LogInformation("Created additional invoice {InvoiceId} for contract {ContractId}",
                    invoice.InvoiceId, contractId);

                return invoice;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create additional invoice for contract {ContractId}", contractId);
                throw;
            }
        }

        public async Task<Invoice> GetOriginalInvoiceAsync(int contractId)
        {
            return _repo.GetAll()
                .Where(i => i.ContractId == contractId)
                .OrderBy(i => i.IssuedAt)
                .FirstOrDefault();
        }

        public async Task<decimal> GetTotalPaidAmountAsync(int contractId)
        {
            return (decimal)_repo.GetAll()
                .Where(i => i.ContractId == contractId && i.Status == InvoiceStatus.Paid)
                .Sum(i => i.AmountPaid);
        }

        private int GenerateOrderCode()
        {
            return new Random().Next(100000, 999999);
        }

    }
}
