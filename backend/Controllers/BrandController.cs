using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Models;
using PublicCarRental.Service.Bran;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BrandController : ControllerBase
    {
        private readonly IBrandService _service;

        public BrandController(IBrandService service)
        {
            _service = service;
        }

        [HttpGet("get-all")]
        public IActionResult GetAll()
        {
            var brands = _service.GetAllBrands();
            return Ok(brands);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var brand = _service.GetBrandById(id);
            if (brand == null) return NotFound();
            return Ok(brand);
        }

        [HttpPost("create-brand")]
        public IActionResult Create([FromBody] VehicleBrand brand)
        {
            _service.CreateBrand(brand);
            return Ok(new { message = "Brand created" });
        }

        [HttpPut("update-brand/{id}")]
        public IActionResult Update(int id, [FromBody] VehicleBrand brand)
        {
            var success = _service.UpdateBrand(id, brand);
            if (!success) return NotFound();
            return Ok(new { message = "Brand updated" });
        }

        [HttpDelete("delete-brand/{id}")]
        public IActionResult Delete(int id)
        {
            var success = _service.DeleteBrand(id);
            if (!success) return NotFound();
            return Ok(new { message = "Brand deleted" });
        }
    }
}