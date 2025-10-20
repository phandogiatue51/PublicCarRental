using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.Service;
using PublicCarRental.Infrastructure.Data.Models;
using System.Net.Sockets;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccidentController : ControllerBase
    {
        private readonly IAccidentService _accidentService;

        public AccidentController(IAccidentService accidentService)
        {
            _accidentService = accidentService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _accidentService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _accidentService.GetByIdAsync(id);
            if (result == null) return NotFound("Accident report not found.");
            return Ok(result);
        }

        [HttpPost("create-contract-report")]
        public async Task<IActionResult> CreateContractAcc([FromForm] ContractAcc dto)
        {
            var result = await _accidentService.CreateContractAccAsync(dto);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        [HttpPost("create-vehicle-report")]
        public async Task<IActionResult> CreateVehicleAcc([FromForm] VehicleAcc dto)
        {
            var result = await _accidentService.CreateVehicleAccAsync(dto);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        [HttpDelete("delete-report/{id}")]
        public async Task<IActionResult> DeleteAcc(int id)
        {
            var result = await _accidentService.DeleteAccAsync(id);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result.Message);
        }

        [HttpPatch("update-report-status/{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] AccidentStatus newStatus)
        {
            var result = await _accidentService.UpdateAccStatusAsync(id, newStatus);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result.Message);
        }
    }
}
