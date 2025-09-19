using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StaffController : ControllerBase
    {
        private readonly EVRentalDbContext _context;

        public StaffController(EVRentalDbContext context)
        {
            _context = context;
        }

        // 👥 Get all staff
        [HttpGet("all-staff")]
        public async Task<IActionResult> GetAllStaff()
        {
            var staffList = await _context.Staffs
                .Include(s => s.Account)
                .Include(s => s.Station)
                .ToListAsync();

            return Ok(staffList);
        }


        [HttpPost("register-staff")]
        public async Task<IActionResult> RegisterStaff(StaffRegistrationDto dto)
        {
            var account = new Account
            {
                Id = Guid.NewGuid(),
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = HashPassword(dto.Password), // Your hashing method
                Role = dto.Role
            };

            _context.Accounts.Add(account);

            var staff = new Staff
            {
                Id = Guid.NewGuid(),
                AccountId = account.Id,
                StationId = dto.StationId
            };

            _context.Staffs.Add(staff);

            await _context.SaveChangesAsync();

            return Ok(new { AccountId = account.Id, StaffId = staff.Id });
        }
        // 🔐 Password hashing helper
        private string HashPassword(string password)
        {
            using var sha = System.Security.Cryptography.SHA256.Create();
            var bytes = System.Text.Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
