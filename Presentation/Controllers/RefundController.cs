//using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Mvc;
//using PublicCarRental.Application.Service.Cont;
//using System.Security.Claims;

//namespace PublicCarRental.Presentation.Controllers
//{
//    [ApiController]
//    [Route("api/admin/refunds")]
//    public class RefundController : ControllerBase
//    {
//        private readonly IRefundService _refundService;

//        [HttpGet("pending")]
//        public async Task<ActionResult<List<RefundRequestDto>>> GetPendingRefunds()
//        {
//            var refunds = await _refundService.GetPendingRefundsAsync();
//            return Ok(refunds);
//        }

//        [HttpPost("{refundRequestId}/approve")]
//        public async Task<ActionResult<RefundApprovalResult>> ApproveRefund(
//            int refundRequestId,
//            [FromBody] ApproveRefundRequest request)
//        {
//            var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
//            var result = await _refundService.ApproveRefundAsync(refundRequestId, adminId, request.Notes);
//            return Ok(result);
//        }

//        [HttpPost("{refundRequestId}/reject")]
//        public async Task<ActionResult<RefundApprovalResult>> RejectRefund(
//            int refundRequestId,
//            [FromBody] RejectRefundRequest request)
//        {
//            var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
//            var result = await _refundService.RejectRefundAsync(refundRequestId, adminId, request.RejectionReason);
//            return Ok(result);
//        }
//    }
//}
