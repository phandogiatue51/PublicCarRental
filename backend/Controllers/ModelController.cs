using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
            var model = _service.GetModelById(id);
            if (model == null) return NotFound();
            return Ok(model);
        }

        [HttpPost("create-model")]
        public IActionResult Create([FromBody] VehicleModel model)
        {
            _service.CreateModel(model);
            return Ok(new { message = "Model created" });
        }

        [HttpPut("update-model/{id}")]
        public IActionResult Update(int id, [FromBody] VehicleModel model)
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
