//using PublicCarRental.Application.Service.Inv;
//using PublicCarRental.Infrastructure.Data.Models;
//using PublicCarRental.Infrastructure.Data.Repository.Cont;

//namespace PublicCarRental.Application.Service.Cont
//{
//    public interface IRefundService
//    {
//        Task<RefundRequestResult> RequestRefundAsync(int contractId, decimal amount, string reason, RefundType type);
//        Task<RefundApprovalResult> ApproveRefundAsync(int refundRequestId, int adminId, string notes = null);
//        Task<RefundApprovalResult> RejectRefundAsync(int refundRequestId, int adminId, string rejectionReason);
//        Task<IEnumerable<RefundRequestDto>> GetPendingRefundsAsync();
//        Task ProcessRefundPaymentAsync(int refundRequestId);
//    }

//    public class RefundService : IRefundService
//    {
//        private readonly IRefundRepository _refundRepository;
//        private readonly IContractRepository _contractRepository;
//        private readonly IInvoiceService _invoiceService;
//        private readonly IRabbitMQService _rabbitMQService;
//        private readonly ILogger<RefundService> _logger;

//        public async Task<RefundRequestResult> RequestRefundAsync(int contractId, decimal amount, string reason, RefundType type)
//        {
//            var contract = await _contractRepository.GetByIdAsync(contractId);
//            if (contract == null)
//                return RefundRequestResult.Failure("Contract not found");

//            // Validate refund amount doesn't exceed paid amount
//            var totalPaid = await _invoiceService.GetTotalPaidAmountAsync(contractId);
//            if (amount > totalPaid)
//                return RefundRequestResult.Failure("Refund amount exceeds paid amount");

//            var refundRequest = new RefundRequest
//            {
//                ContractId = contractId,
//                Amount = amount,
//                Reason = reason,
//                Type = type,
//                Status = RefundStatus.PendingApproval,
//                RequestedAt = DateTime.UtcNow,
//                RequestedBy = "System" // or staff ID if staff-initiated
//            };

//            _refundRepository.Create(refundRequest);

//            // Notify admin for approval
//            await _rabbitMQService.PublishRefundRequestedAsync(refundRequest);

//            return RefundRequestResult.Success(refundRequest.RefundRequestId);
//        }

//        public async Task<RefundApprovalResult> ApproveRefundAsync(int refundRequestId, int adminId, string notes = null)
//        {
//            var refundRequest = await _refundRepository.GetByIdAsync(refundRequestId);
//            if (refundRequest == null)
//                return RefundApprovalResult.Failure("Refund request not found");

//            if (refundRequest.Status != RefundStatus.PendingApproval)
//                return RefundApprovalResult.Failure("Refund request already processed");

//            refundRequest.Status = RefundStatus.Approved;
//            refundRequest.ApprovedBy = adminId;
//            refundRequest.ApprovedAt = DateTime.UtcNow;
//            refundRequest.AdminNotes = notes;

//            _refundRepository.Update(refundRequest);

//            // Process actual refund payment
//            await ProcessRefundPaymentAsync(refundRequestId);

//            return RefundApprovalResult.Success(refundRequest.RefundRequestId);
//        }

//        public async Task ProcessRefundPaymentAsync(int refundRequestId)
//        {
//            var refundRequest = await _refundRepository.GetByIdAsync(refundRequestId);

//            try
//            {
//                // Integrate with your payment provider's refund API
//                var refundResult = await _paymentService.ProcessRefundAsync(
//                    refundRequest.Contract.Invoices.First(i => i.Status == InvoiceStatus.Paid).OrderCode,
//                    refundRequest.Amount
//                );

//                if (refundResult.Success)
//                {
//                    refundRequest.Status = RefundStatus.Completed;
//                    refundRequest.ProcessedAt = DateTime.UtcNow;
//                    _refundRepository.Update(refundRequest);

//                    // Notify customer
//                    await _rabbitMQService.PublishRefundProcessedAsync(refundRequest);
//                }
//                else
//                {
//                    refundRequest.Status = RefundStatus.Failed;
//                    refundRequest.FailureReason = refundResult.Message;
//                    _refundRepository.Update(refundRequest);
//                }
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Failed to process refund {RefundRequestId}", refundRequestId);
//                refundRequest.Status = RefundStatus.Failed;
//                refundRequest.FailureReason = ex.Message;
//                _refundRepository.Update(refundRequest);
//            }
//        }
//    }
//}
