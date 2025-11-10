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
        var result = await _refundService.StaffRefundAsync(request);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}