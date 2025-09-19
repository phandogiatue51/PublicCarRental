using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Controllers
{
    [ApiController]
    //[Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly EVRentalDbContext _context;

        public AdminController(EVRentalDbContext context)
        {
            _context = context;
        }

    }
}