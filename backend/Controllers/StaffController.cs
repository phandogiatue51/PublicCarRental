using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs.Staf;
using PublicCarRental.Models;
using PublicCarRental.Service.Acc;
using PublicCarRental.Service.Staf;

namespace PublicCarRental.Controllers
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
            var accountId = _accountService.CreateAccount(dto.FullName, dto.Email, dto.Password,dto.PhoneNumber, dto.IdentityCardNumber, AccountRole.Staff);

            _staffService.CreateStaff(accountId, dto);

            return Ok(new { message = "Staff registered successfully", accountId });
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
