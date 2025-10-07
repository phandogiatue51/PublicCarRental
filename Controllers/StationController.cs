using Microsoft.AspNetCore.Mvc;
using PublicCarRental.DTOs.Stat;
using PublicCarRental.Models;
using PublicCarRental.Service.Stat;

namespace PublicCarRental.Controllers
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
        public IActionResult GetAll()
        {
            var stations = _stationService.GetAllAsync().GetAwaiter().GetResult();
            return Ok(stations);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var station = _stationService.GetByIdAsync(id).GetAwaiter().GetResult();
            if (station == null)
                return NotFound(new { message = "Station not found" });

            return Ok(station);
        }

        [HttpPost("create-station")]
        public IActionResult CreateStation([FromBody] StationUpdateDto dto)
        {
            var station = _stationService.CreateStationAsync(dto);
            return Ok(new { message = "Station created", stationId = station });
        }

        [HttpPut("update-station/{id}")]
        public IActionResult EditStation(int id, [FromBody] StationUpdateDto dto)
        {
            var success = _stationService.UpdateStationAsync(id, dto);
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