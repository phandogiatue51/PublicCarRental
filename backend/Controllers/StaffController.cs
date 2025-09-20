using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
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

        [HttpPost("register-staff")]
        public IActionResult RegisterStaff([FromBody] StaffRegistrationDto dto)
        {
            var accountId = _accountService.CreateAccount(dto.FullName, dto.Email, dto.Password,dto.PhoneNumber, dto.IdentityCardNumber, AccountRole.Staff);

            _staffService.CreateStaff(accountId, dto);

            return Ok(new { message = "Staff registered successfully", accountId });
        }

        [HttpPut("update-staff/{id}")]
        public IActionResult UpdateStaff(int id, [FromBody] StaffRegistrationDto updatedStaff)
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
    }
}
