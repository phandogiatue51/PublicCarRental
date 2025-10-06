using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.DTOs.Cont;
using PublicCarRental.DTOs.Veh;
using PublicCarRental.Models;
using PublicCarRental.Service.Veh;
using System.Threading.Tasks;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehicleController : ControllerBase
    {
        private readonly IVehicleService _service;

        public VehicleController(IVehicleService service)
        {
            _service = service;
        }

        [HttpGet("get-all")]
        public IActionResult GetAll()
        {
            var vehicles = _service.GetAllVehiclesAsync();
            return Ok(vehicles);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var vehicle = _service.GetByIdAsync(id);
            if (vehicle == null) return NotFound();
            return Ok(vehicle);
        }

        [HttpPost("create-vehicle")]
        public async Task<IActionResult> CreateAsync([FromBody] VehicleCreateDto dto)
        {
            var result = await _service.CreateVehicleAsync(dto);

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message, vehicleId = result.VehicleId });
        }

        [HttpPut("update-vehicle/{id}")]
        public async Task<IActionResult> UpdateAsync(int id, [FromBody] VehicleUpdateDto vehicle)
        {
            var result = await _service.UpdateVehicleAsync(id, vehicle);

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        [HttpDelete("delete-vehicle/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteVehicleAsync(id);
            if (!success) return NotFound();
            return Ok(new { message = "Vehicle deleted" });
        }

        [HttpGet("available-vehicles")]
        public IActionResult GetAvailableVehicles(
             [FromQuery] int modelId,
             [FromQuery] int stationId,
             [FromQuery] DateTime startTime,
             [FromQuery] DateTime endTime)
        {
            var vehicles = _service.GetFirstAvailableVehicleByModel(modelId, stationId, startTime, endTime);
            if (vehicles == null) return NotFound(new { message = "No available vehicles found" });
            return Ok("You can rent this vehicle!");
        }

        [HttpGet("filter-vehicle")]
        public IActionResult FilterVehicle(
            [FromQuery] int? stationId = null,
            [FromQuery] int? status = null,
            [FromQuery] int? modelId = null,
            [FromQuery] int? typeId = null,
            [FromQuery] int? brandId = null)
        {
            var vehicles = _service.GetVehiclesByFiltersAsync(modelId, status, stationId, typeId, brandId);
            return Ok(vehicles);
        }
    }
}
