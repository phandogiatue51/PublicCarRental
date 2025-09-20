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
            var stations = _stationService.GetAll();
            return Ok(stations);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var station = _stationService.GetById(id);
            if (station == null)
                return NotFound(new { message = "Station not found" });

            return Ok(station);
        }

        [HttpPost("create-station")]
        public IActionResult CreateStation([FromBody] StationUpdateDto dto)
        {
            var station = _stationService.CreateStation(dto);
            return Ok(new { message = "Station created", stationId = station });
        }

        [HttpPut("update-station/{id}")]
        public IActionResult EditStation(int id, [FromBody] StationUpdateDto dto)
        {
            var success = _stationService.UpdateStation(id, dto);
            return Ok(new { message = "Station updated", stationId = id });
        }

        [HttpDelete("delete-station/{id}")]
        public IActionResult DeleteStation(int id)
        {
            var success = _stationService.DeleteStation(id);
            if (!success)
                return NotFound(new { message = "Station not found" });

            return Ok(new { message = "Station deleted" });
        }
    }
}