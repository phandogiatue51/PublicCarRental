using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Application.Service;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccidentController : ControllerBase
    {
        private readonly IAccidentService _accidentService;
        private readonly ILogger<AccidentController> _logger;
        private readonly IContractAccidentHandler _accidentHandler;
        private readonly IContractService _contractService;
        private readonly IVehicleService _vehicleService;

        public AccidentController(IAccidentService accidentService, ILogger<AccidentController> logger, IContractAccidentHandler accidentHandler,
            IContractService contractService, IVehicleService vehicleService)
        {
            _accidentService = accidentService;
            _logger = logger;
            _accidentHandler = accidentHandler;
            _contractService = contractService;
            _vehicleService = vehicleService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var result = await _accidentService.GetAllAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all accident reports");
                return StatusCode(500, "An error occurred while retrieving accident reports");
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var result = await _accidentService.GetByIdAsync(id);
                if (result == null) return NotFound("Accident report not found.");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving accident report with ID {AccidentId}", id);
                return StatusCode(500, "An error occurred while retrieving the accident report");
            }
        }

        [HttpPost("contract-report")]
        public async Task<IActionResult> CreateContractAcc([FromForm] ContractAcc dto)
        {
            try
            {
                var result = await _accidentService.CreateContractAccAsync(dto);
                if (!result.Success) return BadRequest(result.Message);
                return Ok(result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating contract accident report");
                return StatusCode(500, "An error occurred while creating the accident report");
            }
        }

        [HttpPost("vehicle-report")]
        public async Task<IActionResult> CreateVehicleAcc([FromForm] VehicleAcc dto)
        {
            try
            {
                var result = await _accidentService.CreateVehicleAccAsync(dto);
                if (!result.Success) return BadRequest(result.Message);
                return Ok(result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating vehicle accident report");
                return StatusCode(500, "An error occurred while creating the accident report");
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAcc(int id)
        {
            try
            {
                var result = await _accidentService.DeleteAccAsync(id);
                if (!result.Success) return BadRequest(result.Message);
                return Ok(result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting accident report with ID {AccidentId}", id);
                return StatusCode(500, "An error occurred while deleting the accident report");
            }
        }

        [HttpPatch("update-accident/{id}")]
        public async Task<IActionResult> UpdateAccident(int id, AccidentUpdateDto dto)
        {
            try
            {
                var result = await _accidentService.UpdateAccident(id, dto);
                if (!result.Success) return BadRequest(result.Message);
                return Ok(result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status for accident report with ID {AccidentId}", id);
                return StatusCode(500, "An error occurred while updating the accident report status");
            }
        }

        [HttpGet("filter")]
        public IActionResult FilterAccidents([FromQuery] AccidentStatus? status, [FromQuery] int? stationId)
        {
            try
            {
                var result = _accidentService.FilterAccidents(status, stationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering accident reports");
                return StatusCode(500, "An error occurred while filtering accident reports");
            }
        }

        [HttpGet("{accidentId}/replacement-preview")]
        public async Task<ActionResult<ReplacementPreviewDto>> GetReplacementPreview(int accidentId)
        {
            try
            {
                var result = await _accidentHandler.GetReplacementPreviewAsync(accidentId);
                if (!result.Success) return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting replacement preview for accident {AccidentId}", accidentId);
                return StatusCode(500, new ReplacementPreviewDto
                {
                    Success = false,
                    Message = "An internal error occurred"
                });
            }
        }

        [HttpPost("{accidentId}/execute-replacement")]
        public async Task<ActionResult<BulkReplacementResult>> ExecuteReplacement(int accidentId)
        {
            var result = await _accidentHandler.SmartBulkReplaceAsync(accidentId);
            return Ok(result);
        }

        [HttpGet("preview-replacement/{contractId}")]
        public async Task<ActionResult<SingleContractPreviewDto>> PreviewReplacement(int contractId)
        {
            try
            {
                var result = await _accidentHandler.GetSingleContractPreviewAsync(contractId);
                if (!result.Success) return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating replacement preview for contract {ContractId}", contractId);
                return StatusCode(500, new SingleContractPreviewDto
                {
                    Success = false,
                    Message = "An internal error occurred"
                });
            }
        }

        [HttpPost("contract/{contractId}/replace")]
        public async Task<ActionResult<ModificationResultDto>> ReplaceSingleContract(int contractId, [FromBody] ReplaceContractRequest request)
        {
            try
            {
                var result = await _accidentHandler.ConfirmFirstAvailableVehicle(
                    contractId, request.LockKey, request.LockToken);
                if (!result.Success) return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error replacing vehicle for contract {ContractId}", contractId);
                return StatusCode(500, new ModificationResultDto
                {
                    Success = false,
                    Message = "An internal error occurred"
                });
            }
        }

        [HttpPost("confirm-replacement")]
        public async Task<ActionResult<ModificationResultDto>> ConfirmReplacement([FromBody] ConfirmReplacementRequest request)
        {
            try
            {
                var result = await _accidentHandler.ConfirmFirstAvailableVehicle(
                    request.ContractId, request.LockKey, request.LockToken);
                if (!result.Success) return BadRequest(result);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming replacement for contract {ContractId}", request?.ContractId);
                return StatusCode(500, new ModificationResultDto
                {
                    Success = false,
                    Message = "An internal error occurred during confirmation"
                });
            }
        }
        
        [HttpPost("change-model")]
        public async Task<ActionResult<ModificationResultDto>> ChangeVehicleModel([FromQuery] int contractId, [FromQuery] int modelId)
        {
            try
            {
                var contract = _contractService.GetEntityById(contractId);
                if (contract == null)
                    return BadRequest(new ModificationResultDto { Success = false, Message = "Contract not found" });

                var availableVehicles = await _vehicleService.GetAvailableVehiclesByModelAsync(
                    modelId, (int)contract.StationId, contract.StartTime, contract.EndTime);

                availableVehicles = availableVehicles.Where(v => v.VehicleId != contract.VehicleId).ToList();

                if (!availableVehicles.Any())
                {
                    return BadRequest(new ModificationResultDto
                    {
                        Success = false,
                        Message = "No available vehicles for the selected model in this time period"
                    });
                }

                var selectedVehicle = availableVehicles.First();
                contract.VehicleId = selectedVehicle.VehicleId;
                _contractService.UpdateContract(contract);

                return new ModificationResultDto
                {
                    Success = true,
                    Message = $"Vehicle changed to {selectedVehicle.LicensePlate} ({selectedVehicle.Model?.Name})"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing model for contract {ContractId}", contractId);
                return StatusCode(500, new ModificationResultDto
                {
                    Success = false,
                    Message = "An error occurred while changing the vehicle model"
                });
            }
        }

        [HttpGet("refund-preview")]
        public IActionResult GetRefundPreview(int contractId)
        {
            var contract = _contractService.GetEntityById(contractId);
            if (contract == null)
                return NotFound("Contract not found");

            var totalPaid = contract.TotalCost;
            decimal refundAmount = (decimal)totalPaid;

            return Ok(new
            {
                contractId = contract.ContractId,
                totalPaid,
                refundAmount,
                policy ="100% refund"
            });
        }
    }
}
