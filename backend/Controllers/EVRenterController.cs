using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.Models;
using PublicCarRental.Service.Renter;

namespace PublicCarRental.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EVRenterController : ControllerBase
    {
        private readonly IEVRenterService _eVRenterService;

        public EVRenterController(IEVRenterService eVRenterService)
        {
            _eVRenterService = eVRenterService;
        }

        [HttpGet("all-renters")]
        public async Task<IActionResult> GetAllRenters()
        {
            var renters = _eVRenterService.GetAllRenters();

            return Ok(renters);
        }
    }
}
