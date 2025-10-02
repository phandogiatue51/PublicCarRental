using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.DTOs.Cont;
using PublicCarRental.DTOs.Mod;
using PublicCarRental.Models;
using PublicCarRental.Service;
using PublicCarRental.Service.Stat;
using PublicCarRental.Service.Veh;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ModelController : ControllerBase
    {
        private readonly IModelService _service;
        private readonly IVehicleService _vehicleService;

        public ModelController(IModelService service, IVehicleService vehicleService)
        {
            _service = service;
            _vehicleService = vehicleService;
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

        //do not delete this
        [HttpGet("available-images")]
        public IActionResult GetAvailableImages()
        {
            var images = _service.GetAvailableImages();
            return Ok(images);
        }

        [HttpGet("from-brand-and-type")]
        public IActionResult GetModelFromBrandAndType([FromQuery] int? brandId, [FromQuery] int? typeId)
        {
            var models = _service.GetModelFromBrandAndType(brandId, typeId);
            return Ok(models);
        }

        [HttpGet("check-available")]
        public IActionResult CheckAvailability(CreateContractDto dto)
        {
            var vehicle = _vehicleService.GetFirstAvailableVehicleByModel(dto.ModelId, dto.StationId, dto.StartTime, dto.EndTime);
            if (vehicle == null)
            {
                return NotFound($"No available vehicle found for model ID {dto.ModelId} at station ID {dto.StationId} between {dto.StartTime:g} and {dto.EndTime:g}.");
            }
            return Ok("You can rent this model");
        }

        [HttpGet("get-station-from-model/{modelId}")]
        public IActionResult GetStation(int modelId)
        {
            var models = _vehicleService.GetStationFromModel(modelId);
            return Ok(models);
        }
    }
}
