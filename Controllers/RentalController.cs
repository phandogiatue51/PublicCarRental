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
    public class RentalController : ControllerBase
    {
        private readonly EVRentalDbContext _context;

        public RentalController(EVRentalDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "EVRenter")]
        [HttpPost("rent")]
        public async Task<IActionResult> RentVehicle([FromBody] RentalContract contract)
        {
            contract.Id = Guid.NewGuid();
            contract.StartTime = DateTime.UtcNow;
            contract.Status = "Active";

            var vehicle = await _context.Vehicles.FindAsync(contract.VehicleId);
            if (vehicle == null || vehicle.Status != "Available")
                return BadRequest("Vehicle not available");

            vehicle.Status = "Rented";
            _context.RentalContracts.Add(contract);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Rental started", contractId = contract.Id });
        }

        [Authorize(Roles = "Staff")]
        [HttpPost("handover")]
        public async Task<IActionResult> ConfirmHandover([FromBody] HandoverDto dto)
        {
            var contract = await _context.RentalContracts.FindAsync(dto.ContractId);
            if (contract == null || contract.Status != "Active")
                return BadRequest("Invalid contract");

            contract.VehicleConditionOnPickup = dto.Condition;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Handover confirmed" });
        }

        [Authorize(Roles = "EVRenter")]
        [HttpPost("return")]
        public async Task<IActionResult> ReturnVehicle([FromBody] ReturnDto dto)
        {
            var contract = await _context.RentalContracts
                .Include(c => c.Vehicle)
                .FirstOrDefaultAsync(c => c.Id == dto.ContractId);

            if (contract == null || contract.Status != "Active")
                return BadRequest("Invalid contract");

            contract.EndTime = DateTime.UtcNow;
            contract.VehicleConditionOnReturn = dto.Condition;
            contract.Status = "Completed";

            var duration = (contract.EndTime.Value - contract.StartTime).TotalHours;
            contract.TotalCost = (decimal)duration * contract.Vehicle.PricePerHour;

            contract.Vehicle.Status = "Available";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Vehicle returned", totalCost = contract.TotalCost });
        }
    }
}
