using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Bran;
using PublicCarRental.Application.Service.Bran;

namespace PublicCarRental.Presentation.Controllers
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
            var brands = _service.GetAll(); 
            return Ok(brands);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var brand = _service.GetById(id);
            if (brand == null) return NotFound();
            return Ok(brand);
        }

        [HttpPost("create-brand")]
        public IActionResult Create([FromBody] BrandUpdateDto dto)
        {
            var brand = _service.CreateBrand(dto);
            return Ok(new { message = "Brand created", brandId = brand});
        }

        [HttpPut("update-brand/{id}")]
        public IActionResult Update(int id, [FromBody] BrandUpdateDto dto)
        {
            var success = _service.UpdateBrand(id, dto);
            if (!success) return NotFound(new { message = "Brand not found" });
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