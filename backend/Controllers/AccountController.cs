using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PublicCarRental.DTOs;
using PublicCarRental.Helpers;
using PublicCarRental.Models;
using PublicCarRental.Service.Acc;
using PublicCarRental.Service.Renter;
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
        public AccountController(IAccountService accountService, IEVRenterService renterService)
        {
            _accountService = accountService;
            _renterService = renterService;
        }

        [HttpPost("register")]
        public IActionResult RegisterRenter(AccountRegistrationDto dto)
        {
            var accountId = _accountService.CreateAccount(dto.FullName, dto.Email, dto.Password, dto.PhoneNumber, dto.IdentityCardNumber, AccountRole.EVRenter);
            _renterService.CreateRenter(accountId, dto);
            return Ok(new { message = "EVRenter registered", accountId });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            var result = _accountService.Login(dto.Identifier, dto.Password);

            if (!result.Success)
                return Unauthorized(result.Message);

            return Ok(new
            {
                message = result.Message,
                role = result.Role
            });
        }
    }
}
