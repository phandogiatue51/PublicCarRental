using PublicCarRental.Application.DTOs.Pay;
using PublicCarRental.Application.DTOs.Refund;
using PublicCarRental.Application.Service.Pay;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository;
using PublicCarRental.Infrastructure.Data.Repository.Inv;

namespace PublicCarRental.Application.Service
{
    public interface IRefundService
    {
        Task<RefundResultDto> RequestRefundAsync(CreateRefundRequestDto request);
        Task<RefundResultDto> ApproveRefundAsync(int refundId);
        Task<RefundResultDto> ProcessRefundAsync(int refundId, BankAccountInfo bankInfo);
        Task<RefundResultDto> RejectRefundAsync(int refundId, string reason);
        Task<IEnumerable<RefundDto>> GetPendingRefundsAsync();
        Task<RefundDto> GetRefundByIdAsync(int refundId);
        Task<bool> CanRefundBeProcessedAsync(int invoiceId);
        Task<decimal> CalculateMaxRefundAmountAsync(int invoiceId);
    }

    public class RefundService : IRefundService
    {
        private readonly IRefundRepository _refundRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly ITransactionService _transactionService;
        private readonly IPayOSPayoutService _payoutService;
        private readonly ILogger<RefundService> _logger;

        public RefundService(
            IRefundRepository refundRepository,
            IInvoiceRepository invoiceRepository,
            ITransactionService transactionService,
            IPayOSPayoutService payoutService,
            ILogger<RefundService> logger)
        {
            _refundRepository = refundRepository;
            _invoiceRepository = invoiceRepository;
            _transactionService = transactionService;
            _payoutService = payoutService;
            _logger = logger;
        }

        public async Task<RefundResultDto> RequestRefundAsync(CreateRefundRequestDto request)
        {
            try
            {
                var invoice = _invoiceRepository.GetById(request.InvoiceId);
                if (invoice == null)
                    return new RefundResultDto { Success = false, Message = "Invoice not found" };

                // Check if invoice is eligible for refund
                if (!await CanRefundBeProcessedAsync(request.InvoiceId))
                    return new RefundResultDto { Success = false, Message = "Invoice is not eligible for refund" };

                // Check if refund amount is valid
                var maxRefundAmount = await CalculateMaxRefundAmountAsync(request.InvoiceId);
                if (request.Amount > maxRefundAmount)
                    return new RefundResultDto { Success = false, Message = $"Refund amount cannot exceed {maxRefundAmount}" };

                // Check if invoice already has a refund
                var existingRefund = _refundRepository.GetByInvoiceId(request.InvoiceId);
                if (existingRefund != null)
                    return new RefundResultDto { Success = false, Message = "Refund already exists for this invoice" };

                var refund = new Refund
                {
                    InvoiceId = request.InvoiceId,
                    Amount = request.Amount,
                    Reason = request.Reason,
                    Status = RefundStatus.Pending,
                    StaffId = request.StaffId,
                    RequestedDate = DateTime.UtcNow,
                    Note = request.Note
                };

                _refundRepository.Create(refund);

                _logger.LogInformation($"✅ Refund requested: #{refund.RefundId} for invoice #{request.InvoiceId}");

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
                _logger.LogError(ex, $"❌ Failed to request refund for invoice #{request.InvoiceId}");
                return new RefundResultDto { Success = false, Message = ex.Message };
            }
        }

        public async Task<RefundResultDto> ApproveRefundAsync(int refundId)
        {
            try
            {
                var refund = _refundRepository.GetById(refundId);
                if (refund == null)
                    return new RefundResultDto { Success = false, Message = "Refund not found" };

                if (refund.Status != RefundStatus.Pending)
                    return new RefundResultDto { Success = false, Message = $"Refund is already {refund.Status}" };

                refund.Status = RefundStatus.Approved;
                _refundRepository.Update(refund);

                return new RefundResultDto
                {
                    Success = true,
                    Message = "Refund approved successfully",
                    RefundId = refund.RefundId,
                    Status = refund.Status
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to approve refund #{refundId}");
                return new RefundResultDto { Success = false, Message = ex.Message };
            }
        }

        public async Task<RefundResultDto> ProcessRefundAsync(int refundId, BankAccountInfo bankInfo)
        {
            try
            {
                var refund = _refundRepository.GetById(refundId);
                if (refund == null)
                    return new RefundResultDto { Success = false, Message = "Refund not found" };

                if (refund.Status != RefundStatus.Approved)
                    return new RefundResultDto { Success = false, Message = "Refund must be approved before processing" };

                refund.Status = RefundStatus.Processing;
                _refundRepository.Update(refund);

                var payoutResult = await _payoutService.CreateSinglePayoutAsync(refundId, bankInfo, refund.Amount);

                if (payoutResult.Success)
                {
                    refund.Status = RefundStatus.Completed;
                    refund.ProcessedDate = DateTime.UtcNow;
                    refund.PayoutTransactionId = payoutResult.TransactionId;
                    _refundRepository.Update(refund);

                    var invoice = _invoiceRepository.GetById(refund.InvoiceId);
                    invoice.RefundAmount = refund.Amount;
                    invoice.RefundedAt = DateTime.UtcNow;
                    invoice.Status = refund.Amount == invoice.AmountPaid ? InvoiceStatus.Refunded : InvoiceStatus.PartiallyRefunded;
                    _invoiceRepository.Update(invoice);

                    _transactionService.CreateTransaction(
                        refund.InvoiceId,
                        TransactionType.Refund,
                        $"Refund processed: {refund.Reason}"
                    );

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
                    // Payout failed
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

                // Update refund status to failed
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

            // Check conditions for refund eligibility
            return invoice != null &&
                   invoice.Status == InvoiceStatus.Paid &&
                   invoice.AmountPaid > 0 &&
                   invoice.RefundAmount == null; // No existing refund
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