using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PublicCarRental.DTOs.Acc;
using PublicCarRental.Helpers;
using PublicCarRental.Models;
using PublicCarRental.Service.Acc;
using PublicCarRental.Service.Ren;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IEVRenterService _renterService;
        private readonly ILogger<AccountController> _logger;
        public AccountController(IAccountService accountService, 
            IEVRenterService renterService, ILogger<AccountController> logger) 
        {
            _accountService = accountService;
            _renterService = renterService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterRenterAsync(AccountDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.LicenseNumber))
                return BadRequest(new { message = "License number is required." });

            if (string.IsNullOrWhiteSpace(dto.IdentityCardNumber))
                return BadRequest(new { message = "Identity card number is required." });

            var accountResult = _accountService.CreateAccount(dto, AccountRole.EVRenter);

            if (!accountResult.Success)
                return BadRequest(new { message = accountResult.Message });

            var renterResult = await _renterService.CreateRenterAsync((int)accountResult.AccountId, dto);

            if (!renterResult.Success)
                return BadRequest(new { message = renterResult.Message });

            return Ok(new { message = "EVRenter registered successfully", accountId = accountResult.AccountId });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            _logger.LogInformation("Login attempt for identifier: {Identifier}", dto.Identifier);

            var result = _accountService.Login(dto.Identifier, dto.Password);

            if (!result.Success)
            {
                _logger.LogWarning("Login failed for identifier: {Identifier}, reason: {Message}", dto.Identifier, result.Message);
                return BadRequest(new { message = result.Message });
            }

            var user = _accountService.GetAccountByIdentifier(dto.Identifier);
            if (user == null)
            {
                _logger.LogError("User not found after successful login for identifier: {Identifier}", dto.Identifier);
                return BadRequest(new { message = "User not found" });
            }

            _logger.LogInformation("Login successful for user: {AccountId}, role: {Role}", user.AccountId, result.Role);

            switch (result.Role)
            {
                case AccountRole.EVRenter:
                    var renterId = _accountService.GetRenterId(user.AccountId);
                    _logger.LogInformation("EVRenter login - AccountId: {AccountId}, RenterId: {RenterId}", user.AccountId, renterId);
                    if (renterId.HasValue)
                    {
                        return Ok(new 
                        {
                            message = result.Message, 
                            token = result.Token,
                            role = result.Role,
                            accountId = user.AccountId,
                            email = user.Email,
                            fullName = user.FullName,
                            renterId = renterId.Value
                        });
                    }
                    break;

                case AccountRole.Staff:
                    var staffId = _accountService.GetStaffId(user.AccountId);
                    var stationId = _accountService.GetStaffStationId(user.AccountId);
                    _logger.LogInformation("Staff login - AccountId: {AccountId}, StaffId: {StaffId}, StationId: {StationId}", user.AccountId, staffId, stationId);
                    return Ok(new
                    {
                        message = result.Message,
                        token = result.Token,
                        role = result.Role,
                        accountId = user.AccountId,
                        email = user.Email,
                        fullName = user.FullName,
                        staffId = staffId,
                        stationId = stationId
                    });

                case AccountRole.Admin:
                    _logger.LogInformation("Admin login - AccountId: {AccountId}", user.AccountId);
                    return Ok(new 
                    {
                        message = result.Message,
                        token = result.Token,
                        role = result.Role,
                        accountId = user.AccountId,
                        email = user.Email,
                        fullName = user.FullName,
                        isAdmin = true
                    });
            }

            return Ok(new 
            {
                message = result.Message,
                token = result.Token,
                role = result.Role,
                accountId = user.AccountId,
                email = user.Email,
                fullName = user.FullName
            });
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            var accountId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {AccountId} logged out", accountId);

            return Ok(new { message = "Logged out successfully" });
        }


        [HttpGet("verify-email")]
        public IActionResult VerifyEmail([FromQuery] string token)
        {
            var success = _accountService.VerifyEmail(token);

            if (success)
                return Ok(new { message = "Email verified successfully." });
            else
                return BadRequest(new { error = "Invalid or expired token." });
        }

        [HttpPost("change-password")]
        public IActionResult ChangePassword([FromForm] int accountId, [FromForm] ChangePasswordDto dto)
        {
            var result = _accountService.ChangePassword(accountId, dto);

            if (result.success)
                return Ok(new { message = result.message });
            else
                return BadRequest(new { error = result.message });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPasswordAsync([FromForm] string email)
        {
            var result = await _accountService.SendPasswordResetTokenAsync(email);

            if (result.success)
                return Ok(new { message = result.message });
            else
                return BadRequest(new { error = result.message });
        }

        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromForm] string token, [FromForm] string newPassword)
        {
            var result = _accountService.ResetPassword(token, newPassword);

            if (result.success)
                return Ok(new { message = result.message });
            else
                return BadRequest(new { error = result.message });
        }

    }
}
