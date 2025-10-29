using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.Service;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccidentController : ControllerBase
    {
        private readonly IAccidentService _accidentService;
        private readonly ILogger<AccidentController> _logger;

        public AccidentController(IAccidentService accidentService, ILogger<AccidentController> logger)
        {
            _accidentService = accidentService;
            _logger = logger;
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

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] AccidentStatus newStatus)
        {
            try
            {
                var result = await _accidentService.UpdateAccStatusAsync(id, newStatus);
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
    }
}