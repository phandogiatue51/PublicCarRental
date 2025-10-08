using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Trans;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContractController : ControllerBase
    {
        private readonly IContractService _contractService;
        private readonly ITransactionService _transactionService;

        public ContractController(IContractService contractService, ITransactionService transactionService)
        {
            _contractService = contractService;
            _transactionService = transactionService;
        }

        [HttpGet("all")]
        public IActionResult GetAll()
        {
            var contracts = _contractService.GetAll();
            return Ok(contracts);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var contract = _contractService.GetById(id);
            if (contract == null) return NotFound();
            return Ok(contract);
        }

        [HttpPost("create-contract")]
        public IActionResult CreateContract([FromBody] CreateContractDto dto)
        {
            var result = _contractService.CreateContract(dto);

            if (result.Success)
            {
                return Ok(new
                {
                    message = result.Message,
                    result.contractId
                });
            }
            else
            {
                return BadRequest(new { error = result.Message });
            }
        }

        [HttpPost("update-contract/{id}")]
        public IActionResult UpdateContract(int id, [FromBody] UpdateContractDto dto)
        {
            var result = _contractService.UpdateContract(id, dto);
            if (result.Success)
            {
                return Ok(new { message = result.Message });
            }
            else
            {
                return BadRequest(new { error = result.Message });
            }
        }

        [HttpPost("active-contract")]
        public async Task<IActionResult> ActiveContract([FromForm] ConfirmContractDto dto)
        {
            try
            {
                var success = await _contractService.StartRentalAsync(dto);
                if (!success) return NotFound("Contract not found");
                return Ok(new { message = "Handover confirmed", contractId = dto.ContractId });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("finish-contract")]
        public async Task<IActionResult> FinishContract([FromForm] FinishContractDto dto)
        {
            try
            {
                var success = await _contractService.ReturnVehicleAsync(dto);
                if (!success)
                    return NotFound(new { message = "Contract not found or vehicle missing" });

                var contract = _contractService.GetEntityById(dto.ContractId);
                return Ok(new
                {
                    message = "Vehicle returned successfully",
                    contractId = contract.ContractId,
                    totalCost = contract.TotalCost,
                    vehicleStatus = contract.Vehicle.Status.ToString(),
                    contractStatus = contract.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Error during return", details = ex.Message });
            }
        }

        [HttpDelete("delete-contract/{id}")]
        public IActionResult DeleteContract(int id)
        {
            var result = _contractService.DeleteContract(id);
            if (result.Success) return Ok(result.Message);
            return BadRequest(result.Message);
        }

        [HttpGet("get-by-station/{stationId}")]
        public IActionResult GetByStationId(int stationId)
        {
            var contracts = _contractService.GetContractByStationId(stationId);
            return Ok(contracts);
        }
    }
}
