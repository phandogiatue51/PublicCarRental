using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehicleController : ControllerBase
    {
        private readonly EVRentalDbContext _context;

        public VehicleController(EVRentalDbContext context)
        {
            _context = context;
        }

        [HttpGet("vehicles")]
        public async Task<IActionResult> GetVehicles([FromQuery] string status, [FromQuery] Guid? stationId)
        {
            var query = _context.Vehicles.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(v => v.Status == status);

            if (stationId.HasValue)
                query = query.Where(v => v.StationId == stationId.Value);

            var vehicles = await query.ToListAsync();
            return Ok(vehicles);
        }

        [HttpGet("all-vehicles")]
        public async Task<IActionResult> GetAllVehicles()
        {
            var renters = await _context.Vehicles
                .Include(r => r.Station)
                .ToListAsync();
            return Ok(renters);
        }

        [HttpPost("create-vehicle")]
        public async Task<IActionResult> CreateVehicle([FromBody] VehicleCreateDto dto)
        {
            var station = await _context.Stations.FindAsync(dto.StationId);
            if (station == null)
            {
                return NotFound(new { message = "Station not found" });
            }

            var vehicle = new Vehicle
            {
                Id = Guid.NewGuid(),
                Model = dto.Model,
                LicensePlate = dto.LicensePlate,
                BatteryLevel = dto.BatteryLevel,
                Status = "Available", // Default
                PricePerHour = dto.PricePerHour,
                StationId = dto.StationId
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Vehicle created", vehicleId = vehicle.Id });
        }
    }
}
