using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.BadScenario;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/contracts/{contractId}/modifications")]
    public class ContractModificationController : ControllerBase
    {
        private readonly IContractModificationService _modificationService;
        public ContractModificationController(IContractModificationService modificationService)
        {
            _modificationService = modificationService;
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

        [HttpDelete("renter/cancel-contract")]
        public async Task<ActionResult<ModificationResultDto>> CancelContract(
        int contractId, [FromBody] RenterChangeRequest request)
        {
            var result = await _modificationService.HandleRenterCancellation(contractId, request);
            return Ok(result);
        }

        [HttpPost("staff/vehicle-problem")]
        public async Task<ActionResult<ModificationResultDto>> HandleStaffVehicleProblem(
            int contractId, [FromBody] StaffVehicleProblemRequest request)
        {
            var result = await _modificationService.HandleStaffVehicleProblemAsync(contractId, request);
            return Ok(result);
        }
    }
}
