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
        public async Task<IActionResult> GetAllAsync()
        {
            var brands = await _service.GetAllAsync(); 
            return Ok(brands);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetByIdAsync(int id)
        {
            var brand = await _service.GetByIdAsync(id);
            if (brand == null) return NotFound();
            return Ok(brand);
        }

        [HttpPost("create-brand")]
        public async Task<IActionResult> CreateAsync([FromBody] BrandUpdateDto dto)
        {
            var brand = await _service.CreateBrandAsync(dto);
            return Ok(new { message = "Brand created", brandId = brand});
        }

        [HttpPut("update-brand/{id}")]
        public async Task<IActionResult> UpdateAsync(int id, [FromBody] BrandUpdateDto dto)
        {
            var success = await _service.UpdateBrandAsync(id, dto);
            if (!success) return NotFound(new { message = "Brand not found" });
            return Ok(new { message = "Brand updated" });
        }

        [HttpDelete("delete-brand/{id}")]
        public async Task<IActionResult> DeleteAsync(int id)
        {
            var success = await _service.DeleteBrandAsync(id);
            if (!success) return NotFound();
            return Ok(new { message = "Brand deleted" });
        }
    }
}