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
        public IActionResult GetAll() {
            var types = _typeService.GetAllTypes();
            return Ok(types);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id) {
            var type = _typeService.GetById(id);
            if (type == null) return NotFound();
            return Ok(type);
        }
    }
}
