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

        [HttpPost("change-model")]
        public async Task<ActionResult<ModificationResultDto>> ChangeModel(
            int contractId, [FromBody] ChangeModelRequest request)
        {
            var result = await _modificationService.ChangeModelAsync(contractId, request);
            return Ok(result);
        }

        [HttpPost("extend-time")]
        public async Task<ActionResult<ModificationResultDto>> ExtendTime(
            int contractId, [FromBody] ExtendTimeRequest request)
        {
            var result = await _modificationService.ExtendTimeAsync(contractId, request);
            return Ok(result);
        }

        [HttpPost("change-vehicle")]
        public async Task<ActionResult<ModificationResultDto>> ChangeVehicle(
            int contractId, [FromBody] ChangeVehicleRequest request)
        {
            var result = await _modificationService.ChangeVehicleAsync(contractId, request);
            return Ok(result);
        }
    }
}
