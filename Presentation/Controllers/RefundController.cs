using Microsoft.AspNetCore.Authorization;
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

    [HttpPost("{refundId}/approve")]
    public async Task<ActionResult> ApproveRefund(int refundId)
    {
        var result = await _refundService.ApproveRefundAsync(refundId);
        return Ok(result);
    }

    [HttpPost("{refundId}/process")]
    public async Task<ActionResult> ProcessRefund(int refundId, [FromBody] BankAccountInfo bankInfo)
    {
        var result = await _refundService.ProcessRefundAsync(refundId, bankInfo);
        return Ok(result);
    }
}