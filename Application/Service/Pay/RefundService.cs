using PublicCarRental.Application.DTOs.Pay;
using PublicCarRental.Application.DTOs.Refund;
using PublicCarRental.Application.Service.Pay;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Inv;

namespace PublicCarRental.Application.Service
{
    public interface IRefundService
    {
        Task<RefundResultDto> RequestRefundAsync(CreateRefundRequestDto request);
        Task<RefundResultDto> ProcessRefundAsync(int refundId, BankAccountInfo bankInfo, bool? fullRefund = null);
        Task<RefundResultDto> RejectRefundAsync(int refundId, string reason);
        Task<IEnumerable<RefundDto>> GetPendingRefundsAsync();
        Task<RefundDto> GetRefundByIdAsync(int refundId);
        Task<bool> CanRefundBeProcessedAsync(int invoiceId);
        Task<decimal> CalculateMaxRefundAmountAsync(int invoiceId);
        Task<bool> HasInsufficientBalanceError(int refundId);
        Task<RefundResultDto> RetryFailedRefundAsync(int originalRefundId, BankAccountInfo bankInfo);
    }

    public class RefundService : IRefundService
    {
        private readonly IRefundRepository _refundRepository;
        private readonly IPayOSPayoutService _payoutService;
        private readonly ILogger<RefundService> _logger;
        private readonly IContractRepository _contractRepository;
        private readonly IInvoiceRepository _invoiceRepository;

        public RefundService(IRefundRepository refundRepository, IInvoiceRepository invoiceRepository,
            IPayOSPayoutService payoutService, ILogger<RefundService> logger, IContractRepository contractRepository)
        {
            _refundRepository = refundRepository;
            _payoutService = payoutService;
            _logger = logger;
            _contractRepository = contractRepository;
            _invoiceRepository = invoiceRepository;
        }

        public async Task<RefundResultDto> RequestRefundAsync(CreateRefundRequestDto request)
        {
            try
            {
                var contract = _contractRepository.GetById(request.ContractId);
                if (contract == null)
                    return new RefundResultDto { Success = false, Message = "Contract not found" };

                var originalInvoice = contract.Invoices.FirstOrDefault(i =>
                    i.Status == InvoiceStatus.Paid && i.AmountPaid > 0);

                if (originalInvoice == null)
                    return new RefundResultDto { Success = false, Message = "No paid invoice found for this contract" };

                var refundInvoice = new Invoice
                {
                    ContractId = request.ContractId,
                    IssuedAt = DateTime.UtcNow,
                    Status = InvoiceStatus.Refunded,
                    AmountDue = -request.Amount,
                    AmountPaid = -request.Amount,
                    Note = $"Refund request: {request.Reason}",
                    BookingToken = $"REFUND_{originalInvoice.InvoiceId}_{DateTime.UtcNow:yyyyMMddHHmmss}"
                };

                _invoiceRepository.Create(refundInvoice);
                var invoice = _invoiceRepository.GetById(refundInvoice.InvoiceId);

                var refund = new Refund
                {
                    InvoiceId = invoice.InvoiceId,
                    Amount = request.Amount,
                    Reason = request.Reason,
                    Status = RefundStatus.Approved,
                    StaffId = request.StaffId,
                    RequestedDate = DateTime.UtcNow,
                    Note = request.Note
                };

                _refundRepository.Create(refund);

                _logger.LogInformation($"✅ Refund requested: #{refund.RefundId}, Refund Invoice: #{refundInvoice.InvoiceId}");

                return new RefundResultDto
                {
                    Success = true,
                    Message = "Refund request created successfully",
                    RefundId = refund.RefundId,
                    Status = refund.Status
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to request refund for contract #{request.ContractId}");
                return new RefundResultDto { Success = false, Message = ex.Message };
            }
        }

        public async Task<RefundResultDto> ProcessRefundAsync(int refundId, BankAccountInfo bankInfo, bool? fullRefund = null)
        {
            try
            {
                var refund = _refundRepository.GetById(refundId);
                if (refund == null)
                    return new RefundResultDto { Success = false, Message = "Refund not found" };

                if (fullRefund == true)
                {
                    var invoice = _invoiceRepository.GetById(refund.InvoiceId);
                    var contract = _contractRepository.GetById((int)invoice.ContractId);

                    // Calculate the full amount that was paid
                    var totalPaid = contract.TotalCost;
                    if (refund.Amount < totalPaid)
                    {
                        refund.Amount = (decimal)totalPaid;
                        refund.Note += " [STAFF OVERRIDE: 100% refund applied]";
                        _refundRepository.Update(refund);
                    }
                }

                refund.Status = RefundStatus.Processing;
                _refundRepository.Update(refund);

                var payoutResult = await _payoutService.CreateSinglePayoutAsync(refundId, bankInfo, refund.Amount);

                if (payoutResult.Success)
                {
                    refund.Status = RefundStatus.Completed;
                    refund.ProcessedDate = DateTime.UtcNow;
                    _refundRepository.Update(refund);

                    var invoice = _invoiceRepository.GetById(refund.InvoiceId);
                    invoice.RefundAmount = refund.Amount;
                    invoice.RefundedAt = DateTime.UtcNow;
                    invoice.Status = refund.Amount == invoice.AmountPaid ? InvoiceStatus.Refunded : InvoiceStatus.PartiallyRefunded;
                    _invoiceRepository.Update(invoice);

                    _logger.LogInformation($"✅ Refund processed: #{refundId} via PayOS {payoutResult.TransactionId}");

                    return new RefundResultDto
                    {
                        Success = true,
                        Message = "Refund processed successfully",
                        RefundId = refund.RefundId,
                        Status = refund.Status,
                        PayoutTransactionId = payoutResult.TransactionId
                    };
                }
                else
                {
                    refund.Status = RefundStatus.Failed;
                    refund.Note = $"Payout failed: {payoutResult.Message}";
                    _refundRepository.Update(refund);

                    return new RefundResultDto
                    {
                        Success = false,
                        Message = $"Payout failed: {payoutResult.Message}",
                        RefundId = refund.RefundId,
                        Status = refund.Status
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to process refund #{refundId}");

                var refund = _refundRepository.GetById(refundId);
                if (refund != null)
                {
                    refund.Status = RefundStatus.Failed;
                    refund.Note = $"Processing error: {ex.Message}";
                    _refundRepository.Update(refund);
                }

                return new RefundResultDto { Success = false, Message = ex.Message };
            }
        }

        public async Task<RefundResultDto> RejectRefundAsync(int refundId, string reason)
        {
            try
            {
                var refund = _refundRepository.GetById(refundId);
                if (refund == null)
                    return new RefundResultDto { Success = false, Message = "Refund not found" };

                if (refund.Status != RefundStatus.Pending)
                    return new RefundResultDto { Success = false, Message = $"Cannot reject refund with status {refund.Status}" };

                refund.Status = RefundStatus.Rejected;
                refund.Note = $"Rejected. Reason: {reason}";
                _refundRepository.Update(refund);

                return new RefundResultDto
                {
                    Success = true,
                    Message = "Refund rejected successfully",
                    RefundId = refund.RefundId,
                    Status = refund.Status
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to reject refund #{refundId}");
                return new RefundResultDto { Success = false, Message = ex.Message };
            }
        }

        public async Task<RefundResultDto> RetryFailedRefundAsync(int originalRefundId, BankAccountInfo bankInfo)
        {
            var originalRefund = _refundRepository.GetById(originalRefundId);
            if (originalRefund == null)
                return new RefundResultDto { Success = false, Message = "Original refund not found" };

            if (originalRefund.Status != RefundStatus.Failed)
                return new RefundResultDto { Success = false, Message = "Can only retry failed refunds" };

            var retryRefund = new Refund
            {
                InvoiceId = originalRefund.InvoiceId,
                Amount = originalRefund.Amount,
                Reason = $"[RETRY] {originalRefund.Reason}",
                Status = RefundStatus.Approved,
                StaffId = originalRefund.StaffId,
                RequestedDate = DateTime.UtcNow,
                Note = $"Retry attempt for failed refund #{originalRefund.RefundId}"
            };

            _refundRepository.Create(retryRefund);

            return await ProcessRefundAsync(retryRefund.RefundId, bankInfo);
        }

        public async Task<bool> HasInsufficientBalanceError(int refundId)
        {
            var refund = _refundRepository.GetById(refundId);
            return refund?.Note?.Contains("Số dư tài khoản không đủ") ?? false;
        }

        public async Task<IEnumerable<RefundDto>> GetPendingRefundsAsync()
        {
            var refunds = _refundRepository.GetByStatus(RefundStatus.Pending);
            return refunds.Select(r => MapToDto(r));
        }

        public async Task<RefundDto> GetRefundByIdAsync(int refundId)
        {
            var refund = _refundRepository.GetById(refundId);
            return refund == null ? null : MapToDto(refund);
        }

        public async Task<bool> CanRefundBeProcessedAsync(int invoiceId)
        {
            var invoice = _invoiceRepository.GetById(invoiceId);

            return invoice != null &&
                   invoice.Status == InvoiceStatus.Paid &&
                   invoice.AmountPaid > 0 &&
                   invoice.RefundAmount == null;
        }

        public async Task<decimal> CalculateMaxRefundAmountAsync(int invoiceId)
        {
            var invoice = _invoiceRepository.GetById(invoiceId);
            if (invoice == null) return 0;

            return invoice.AmountPaid ?? 0;
        }

        private RefundDto MapToDto(Refund refund)
        {
            return new RefundDto
            {
                RefundId = refund.RefundId,
                InvoiceId = refund.InvoiceId,
                Amount = refund.Amount,
                Reason = refund.Reason,
                Status = refund.Status,
                RequestedDate = refund.RequestedDate,
                ProcessedDate = refund.ProcessedDate,
                StaffId = refund.StaffId,
                PayoutTransactionId = refund.PayoutTransactionId,
                Note = refund.Note
            };
        }
    }
}