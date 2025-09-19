using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EVRenterController : ControllerBase
    {
        private readonly EVRentalDbContext _context;

        public EVRenterController(EVRentalDbContext context)
        {
            _context = context;
        }

        //[Authorize(Roles = "Staff,Admin")]
        [HttpGet("all-renters")]
        public async Task<IActionResult> GetAllRenters()
        {
            var renters = await _context.EVRenters
                .Include(r => r.Account)
                .Include(r => r.RentalContracts)
                .ToListAsync();

            return Ok(renters);
        }
    }
}
