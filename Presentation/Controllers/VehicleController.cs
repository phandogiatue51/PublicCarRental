using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Application.Service.Veh;

namespace PublicCarRental.Presentation.Controllers
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
        public async Task<IActionResult> GetAllAsync()
        {
            var vehicles = await _service.GetAllVehiclesAsync();
            return Ok(vehicles);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetByIdAsync(int id)
        {
            var vehicle = await _service.GetByIdAsync(id);
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

        [HttpGet("filter-vehicle")]
        public async Task<IActionResult> FilterVehicleAsync(
            [FromQuery] int? stationId = null,
            [FromQuery] int? status = null,
            [FromQuery] int? modelId = null,
            [FromQuery] int? typeId = null,
            [FromQuery] int? brandId = null)
        {
            var vehicles = await _service.GetVehiclesByFiltersAsync(modelId, status, stationId, typeId, brandId);
            return Ok(vehicles);
        }

        [HttpPost("check-availability")]
        public async Task<IActionResult> CheckAvailabilityAsync([FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? stationId = null)
        {
            startDate ??= DateTime.UtcNow;
            endDate ??= DateTime.UtcNow.AddDays(1);
            var isAvailable = await _service.GetAvailableAsync(startDate, endDate, stationId);
            return Ok(isAvailable);
        }

        [HttpGet("available-vehicles")]
        public async Task<IActionResult> GetAvailableVehicles([FromQuery] int? modelId, [FromQuery] int? stationId, [FromQuery] DateTime startTime, [FromQuery] DateTime endTime)
        {
            try
            {
                var vehicles = await _service.GetAvailableVehiclesByModelAsync((int)modelId, (int)stationId, startTime, endTime);
                return Ok(vehicles);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
