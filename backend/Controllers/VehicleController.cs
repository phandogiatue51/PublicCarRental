using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.DTOs.Veh;
using PublicCarRental.Models;
using PublicCarRental.Service.Veh;

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
            var vehicles = _service.GetAllVehicles();
            return Ok(vehicles);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var vehicle = _service.GetById(id);
            if (vehicle == null) return NotFound();
            return Ok(vehicle);
        }

        [HttpPost("create-vehicle")]
        public IActionResult Create([FromBody] VehicleCreateDto dto)
        {
            var vehicle = _service.CreateVehicle(dto);
            return Ok(new { message = "Vehicle created", vehicleId = vehicle});
        }

        [HttpPut("update-vehicle/{id}")]
        public IActionResult Update(int id, [FromBody] VehicleUpdateDto vehicle)
        {
            var success = _service.UpdateVehicle(id, vehicle);
            if (!success) return NotFound();
            return Ok(new { message = "Vehicle updated" });
        }

        [HttpDelete("delete-vehicle/{id}")]
        public IActionResult Delete(int id)
        {
            var success = _service.DeleteVehicle(id);
            if (!success) return NotFound();
            return Ok(new { message = "Vehicle deleted" });
        }
    }
}
