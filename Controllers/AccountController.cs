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
        public IActionResult RegisterRenter(AccountDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.LicenseNumber))
                return BadRequest(new { message = "License number is required." });

            if (string.IsNullOrWhiteSpace(dto.IdentityCardNumber))
                return BadRequest(new { message = "Identity card number is required." });

            var accountResult = _accountService.CreateAccount(dto, AccountRole.EVRenter);

            if (!accountResult.Success)
                return BadRequest(new { message = accountResult.Message });

            var renterResult = _renterService.CreateRenter((int)accountResult.AccountId, dto);

            if (!renterResult.Success)
                return BadRequest(new { message = renterResult.Message });

            return Ok(new { message = "EVRenter registered successfully", accountId = accountResult.AccountId });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            var result = _accountService.Login(dto.Identifier, dto.Password);

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new
            {
                message = result.Message, 
                token = result.Token,
                role = result.Role
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
        public IActionResult ForgotPassword([FromForm] string email)
        {
            var result = _accountService.SendPasswordResetToken(email);

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

        [HttpPost("send-token")]
        public IActionResult SendVerificationToken([FromForm] string email)
        {
            var result = _accountService.SendToken(email);

            if (result.success)
                return Ok(new { message = result.message });
            else
                return BadRequest(new { error = result.message });
        }

        [HttpGet("validate-reset-token")]
        public IActionResult ValidateResetToken([FromQuery] string token)
        {
            var isValid = _accountService.ValidatePasswordResetToken(token);

            if (isValid)
                return Ok(new { message = "Token is valid." });
            else
                return BadRequest(new { error = "Token is invalid or expired." });
        }
    }
}
