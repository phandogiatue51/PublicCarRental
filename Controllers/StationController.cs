using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StationController : ControllerBase
    {
        private readonly EVRentalDbContext _context;

        public StationController(EVRentalDbContext context)
        {
            _context = context;
        }

        // 🏢 Get all stations
        [HttpGet("all-stations")]
        public async Task<IActionResult> GetAllStations()
        {
            var stations = await _context.Stations
                .Include(s => s.Vehicles)
                .Include(s => s.StaffMembers)
                .ToListAsync();

            return Ok(stations);
        }

        [HttpPost("create-station")]
        public async Task<IActionResult> CreateStation([FromBody] StationCreateDto dto)
        {
            var station = new Station
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Address = dto.Address,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude
            };

            _context.Stations.Add(station);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Station created", stationId = station.Id });
        }
    }
}
