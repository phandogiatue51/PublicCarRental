using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.Service.Typ;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TypeController : ControllerBase
    {
        private readonly ITypeService _typeService;
        public TypeController(ITypeService typeService) {
            _typeService = typeService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAllAsync() {
            var types = await _typeService.GetAllTypesAsync();
            return Ok(types);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetByIdAsync(int id) {
            var type = await _typeService.GetByIdAsync(id);
            if (type == null) return NotFound();
            return Ok(type);
        }
    }
}
