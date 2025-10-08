using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Acc;
using PublicCarRental.Application.DTOs.Staf;
using PublicCarRental.Application.Service.Acc;
using PublicCarRental.Application.Service.Staf;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StaffController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IStaffService _staffService;
        public StaffController(IAccountService accountService, IStaffService staffService)
        {
            _accountService = accountService;
            _staffService = staffService;
        }

        [HttpGet("all-staff")]
        public IActionResult GetAllStaff()
        {
            var staffList = _staffService.GetAllStaff(); 
            return Ok(staffList);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var staff = _staffService.GetById(id); 
            if (staff == null) return NotFound();
            return Ok(staff);
        }

        [HttpPost("register-staff")]
        public IActionResult RegisterStaff([FromBody] StaffDto dto)
        {
            var accountResult = _accountService.CreateAccount(new AccountDto
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Password = dto.Password,
                PhoneNumber = dto.PhoneNumber,
                IdentityCardNumber = dto.IdentityCardNumber
            }, AccountRole.Staff);

            if (!accountResult.Success)
                return BadRequest(new { message = accountResult.Message });

            var staffResult = _staffService.CreateStaff((int)accountResult.AccountId, dto);

            if (!staffResult.Success)
                return BadRequest(new { message = staffResult.Message });

            return Ok(new
            {
                message = "Staff registered successfully",
                accountId = accountResult.AccountId
            });
        }

        [HttpPut("update-staff/{id}")]
        public IActionResult UpdateStaff(int id, [FromBody] StaffUpdateDto updatedStaff)
        {
            var success = _staffService.UpdateStaff(id, updatedStaff);
            if (!success) return NotFound("Staff not found");
            return Ok("Staff updated");
        }

        [HttpDelete("delete-staff/{id}")]
        public IActionResult DeleteStaff(int id)
        {
            var success = _staffService.DeleteStaff(id);
            if (!success) return NotFound("Staff not found");
            return Ok("Staff marked as OnLeave");
        }

        [HttpPost("change-status/{id}")]
        public IActionResult ChangeStaffStatus(int id)
        {
            var success = _staffService.ChangeStatus(id);
            if (!success) return NotFound("Staff not found");
            return Ok($"Staff status changed");
        }
    }
}
