using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Pay;
using PublicCarRental.Application.DTOs.Refund;
using PublicCarRental.Application.Service;

[ApiController]
[Route("api/[controller]")]
public class RefundController : ControllerBase
{
    private readonly IRefundService _refundService;

    public RefundController(IRefundService refundService)
    {
        _refundService = refundService;
    }

    [HttpPost("request")]
    public async Task<ActionResult> RequestRefund(CreateRefundRequestDto request)
    {
        var result = await _refundService.RequestRefundAsync(request);
        return Ok(result);
    }

    [HttpPost("{refundId}/process")]
    public async Task<ActionResult> ProcessRefund(int refundId, [FromBody] ProcessRefundRequest request)
    {
        var result = await _refundService.ProcessRefundAsync(refundId, request.BankInfo, request.FullRefund);
        return Ok(result);
    }

    [HttpPost("staff-refund")]
    public async Task<ActionResult> StaffRefund([FromBody] StaffRefundRequest request)
    {
        var refundRequest = new CreateRefundRequestDto
        {
            ContractId = request.ContractId,
            Amount = request.Amount,
            Reason = request.Reason,
            StaffId = request.StaffId,
            Note = request.Note
        };

        var refundResult = await _refundService.RequestRefundAsync(refundRequest);

        if (!refundResult.Success)
            return BadRequest(refundResult);

        var processResult = await _refundService.ProcessRefundAsync(
            refundResult.RefundId, request.BankInfo, request.FullRefund);

        return Ok(processResult);
    }
}