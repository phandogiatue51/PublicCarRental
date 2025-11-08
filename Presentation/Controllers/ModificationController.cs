using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Pay;
using PublicCarRental.Application.Service;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/contracts/{contractId}/modifications")]
    public class ModificationController : ControllerBase
    {
        private readonly IContractModificationService _modificationService;
        private readonly IContractService _contractService;
        private readonly IRefundService _refundService;
        private readonly IPendingChangeService _pendingChangeService;
        private readonly ILogger<ModificationController> _logger; 

        public ModificationController(IContractModificationService modificationService, IRefundService refundService,
            IContractService contractService, IPendingChangeService pendingChangeService, Logger<ModificationController> logger)
        {
            _modificationService = modificationService;
            _refundService = refundService;
            _contractService = contractService;
            _pendingChangeService = pendingChangeService;
            _logger = logger;
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

            if (contract.Status != Infrastructure.Data.Models.RentalStatus.Confirmed)
            {
                return BadRequest("Refund is only available for confirmed contracts");
            }

            var totalPaid = contract.TotalCost ?? 0;
            var daysUntilStart = (contract.StartTime - DateTime.UtcNow).TotalDays;

            decimal refundAmount = 0;
            string policy;

            if (daysUntilStart >= 2)
            {
                refundAmount = totalPaid;
                policy = "100% refund (more than 2 days before start)";
            }
            else if (daysUntilStart >= 0)
            {
                refundAmount = totalPaid * 0.8m;
                policy = "80% refund (less than 2 days before start)";
            }
            else
            {
                refundAmount = 0;
                policy = "No refund (after rental start time)";
            }

            return Ok(new
            {
                contractId = contract.ContractId,
                totalPaid,
                refundAmount,
                daysUntilStart = Math.Round(daysUntilStart, 1),
                policy,
                canCancel = daysUntilStart >= 0
            });
        }

        [HttpPost("cancel-contract")]
        public async Task<IActionResult> CancelContract(int contractId, [FromBody] BankAccountInfo dto)
        {
            if (dto == null)
                return BadRequest(new { success = false, message = "Bank information is required for refund." });

            var contract = _contractService.GetEntityById(contractId);
            if (contract == null)
                return NotFound(new { success = false, message = "Contract not found" });

            if (contract.Status != Infrastructure.Data.Models.RentalStatus.Confirmed)
            {
                return BadRequest(new { success = false, message = "Only confirmed contracts can be cancelled" });
            }

            if (contract.StartTime <= DateTime.UtcNow)
            {
                return BadRequest(new { success = false, message = "Cannot cancel contract after rental start time" });
            }

            var result = await _modificationService.HandleRenterCancellation(contractId, dto);

            return Ok(new
            {
                success = result.Success,
                message = result.Message,
                refundId = result.RefundId,
                contractStatus = "Cancelled",
                refundAmount = result.PriceDifference
            });
        }

        [HttpGet("status")]
        public IActionResult GetContractStatus(int contractId)
        {
            var contract = _contractService.GetById(contractId);
            if (contract == null)
                return NotFound();

            var refund = _refundService.GetRefundByContractId(contractId);

            return Ok(new
            {
                contractId = contract.ContractId,
                status = contract.Status.ToString(),
                refundStatus = refund?.Status.ToString() ?? "None",
                refundAmount = refund?.TotalCost ?? 0,
                lastUpdated = DateTime.UtcNow
            });
        }

        [HttpGet("pending-status/{invoiceId}")]
        public async Task<IActionResult> GetPendingStatus(int contractId, int invoiceId)
        {
            try
            {
                var pendingChange = await _pendingChangeService.GetByInvoiceIdAsync(invoiceId);
                var contract = _contractService.GetById(contractId);

                return Ok(new
                {
                    hasPendingChanges = pendingChange != null,
                    isCompleted = pendingChange == null,
                    contractStatus = contract?.Status.ToString(),
                    currentVehicleId = contract?.VehicleId,
                    lastUpdated = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking pending status for invoice {InvoiceId}", invoiceId);
                return StatusCode(500, new { error = "Failed to check modification status" });
            }
        }
    }
}
