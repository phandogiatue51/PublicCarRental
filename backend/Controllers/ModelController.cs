using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.DTOs.Mod;
using PublicCarRental.Models;
using PublicCarRental.Service;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ModelController : ControllerBase
    {
        private readonly IModelService _service;

        public ModelController(IModelService service)
        {
            _service = service;
        }

        [HttpGet("get-all")]
        public IActionResult GetAll()
        {
            var models = _service.GetAllModels();
            return Ok(models);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var model = _service.GetById(id);
            if (model == null) return NotFound();
            return Ok(model);
        }

        [HttpPost("create-model")]
        public IActionResult Create([FromBody] ModelCreateDto dto)
        {
            var model = _service.CreateModel(dto);
            return Ok(new { message = "Model created", modelId = model});
        }

        [HttpPut("update-model/{id}")]
        public IActionResult Update(int id, [FromBody] ModelCreateDto model)
        {
            var success = _service.UpdateModel(id, model);
            if (!success) return NotFound();
            return Ok(new { message = "Model updated" });
        }

        [HttpDelete("delete-model/{id}")]
        public IActionResult Delete(int id)
        {
            var success = _service.DeleteModel(id);
            if (!success) return NotFound();
            return Ok(new { message = "Model deleted" });
        }
    }
}
