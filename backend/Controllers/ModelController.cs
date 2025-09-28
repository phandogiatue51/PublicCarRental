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
        public IActionResult Create([FromForm] ModelCreateDto dto)
        {
            // Debug logging
            Console.WriteLine($"Received DTO - Name: {dto?.Name}, BrandId: {dto?.BrandId}, TypeId: {dto?.TypeId}");
            Console.WriteLine($"Image file: {dto?.imageFile?.FileName}, Size: {dto?.imageFile?.Length}");
            
            if (dto == null)
            {
                return BadRequest("DTO is null");
            }
            
            if (string.IsNullOrEmpty(dto.Name))
            {
                return BadRequest("Name is required");
            }
            
            var model = _service.CreateModel(dto, dto.imageFile);
            return Ok(new { message = "Model created", modelId = model});
        }

        [HttpPut("update-model/{id}")]
        public IActionResult Update(int id, [FromForm] ModelCreateDto model)
        {
            var success = _service.UpdateModel(id, model, model.imageFile);
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

        [HttpGet("available-images")]
        public IActionResult GetAvailableImages()
        {
            var images = _service.GetAvailableImages();
            return Ok(images);
        }
    }
}
