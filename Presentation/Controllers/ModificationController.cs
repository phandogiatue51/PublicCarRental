using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Pay;
using PublicCarRental.Application.Service;
using PublicCarRental.Application.Service.Cont;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/contracts/{contractId}/modifications")]
    public class ModificationController : ControllerBase
    {
        private readonly IContractModificationService _modificationService;
        private readonly IContractService _contractService;
        private readonly IRefundService _refundService;

        public ModificationController(IContractModificationService modificationService, IRefundService refundService,
            IContractService contractService)
        {
            _modificationService = modificationService;
            _refundService = refundService;
            _contractService = contractService;
        }

        [HttpPost("renter/change-model")]
        public async Task<ActionResult<ModificationResultDto>> ChangeModel(
            int contractId, [FromBody] RenterChangeRequest request)
        {
            var result = await _modificationService.ChangeModelAsync(contractId, request);
            return Ok(result);
        }

        [HttpPost("renter/extend-time")]
        public async Task<ActionResult<ModificationResultDto>> ExtendTime(
            int contractId, [FromBody] RenterChangeRequest request)
        {
            var result = await _modificationService.ExtendTimeAsync(contractId, request);
            return Ok(result);
        }

        [HttpPost("renter/change-vehicle")]
        public async Task<ActionResult<ModificationResultDto>> ChangeVehicle(
            int contractId, [FromBody] RenterChangeRequest request)
        {
            var result = await _modificationService.ChangeVehicleAsync(contractId, request);
            return Ok(result);
        }

        [HttpGet("refund-preview")]
        public IActionResult GetRefundPreview(int contractId)
        {
            var contract = _contractService.GetEntityById(contractId);
            if (contract == null)
                return NotFound("Contract not found");

            var totalPaid = contract.TotalCost;
            var daysUntilStart = (contract.StartTime - DateTime.UtcNow).TotalDays;

            decimal refundAmount = (decimal)totalPaid;
            if (daysUntilStart < 2)
                refundAmount = (decimal)(totalPaid * 0.8m);

            return Ok(new
            {
                contractId = contract.ContractId,
                totalPaid,
                refundAmount,
                daysUntilStart = Math.Round(daysUntilStart, 1),
                policy = daysUntilStart < 2
                    ? "80% refund (less than 2 days before start)"
                    : "100% refund (more than 2 days before start)"
            });
        }

        [HttpPost("cancel-contract")]
        public async Task<IActionResult> CancelContract(int contractId, BankAccountInfo dto)
        {
            if (dto == null)
                return BadRequest("Bank information is required for refund.");

            var result = await _modificationService.HandleRenterCancellation(contractId, dto);

            if (!result.Success)
                return BadRequest(result.Message);

            var refundProcess = await _refundService.ProcessRefundAsync((int)result.RefundId, dto);

            if (!refundProcess.Success)
                return StatusCode(500, new
                {
                    message = "Contract cancelled, but refund processing failed.",
                    refund = refundProcess
                });

            return Ok(new
            {
                message = "Contract cancelled and refund processed successfully.",
                refund = refundProcess
            });
        }
    }
}
