using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Stat;
using PublicCarRental.Application.Service.Stat;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StationController : ControllerBase
    {
        private readonly IStationService _stationService;

        public StationController(IStationService stationService)
        {
            _stationService = stationService;
        }

        [HttpGet("all-stations")]
        public async Task<IActionResult> GetAllAsync()
        {
            var stations = await _stationService.GetAllAsync();
            return Ok(stations);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetByIdAsync(int id)
        {
            var station = await _stationService.GetByIdAsync(id);
            if (station == null)
                return NotFound(new { message = "Station not found" });

            return Ok(station);
        }

        [HttpPost("create-station")]
        public async Task<IActionResult> CreateStationAsync([FromBody] StationUpdateDto dto)
        {
            var station = await _stationService.CreateStationAsync(dto);
            return Ok(new { message = "Station created", stationId = station });
        }

        [HttpPut("update-station/{id}")]
        public async Task<IActionResult> EditStationAsync(int id, [FromBody] StationUpdateDto dto)
        {
            var success = await _stationService.UpdateStationAsync(id, dto);
            return Ok(new { message = "Station updated", stationId = id });
        }

        [HttpDelete("delete-station/{id}")]
        public async Task<IActionResult> DeleteStation(int id)
        {
            var (success, message) = await _stationService.DeleteStationAsync(id);

            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }
    }
}