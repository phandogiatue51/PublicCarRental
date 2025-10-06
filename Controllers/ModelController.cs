using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.DTOs.Cont;
using PublicCarRental.DTOs.Mod;
using PublicCarRental.DTOs.Veh;
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
        public async Task<IActionResult> Create([FromForm] ModelCreateDto dto)
        {
            if (dto == null) return BadRequest("DTO is null");
            if (string.IsNullOrEmpty(dto.Name)) return BadRequest("Name is required");

            var modelId = await _service.CreateModelAsync(dto, dto.ImageFile);
            return Ok(new { message = "Model created", modelId = modelId });
        }

        [HttpPut("update-model/{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] ModelCreateDto model)
        {
            var success = await _service.UpdateModelAsync(id, model, model.ImageFile);
            return success ? Ok(new { message = "Model updated" }) : NotFound();
        }

        [HttpDelete("delete-model/{id}")]
        public IActionResult Delete(int id)
        {
            var success = _service.DeleteModel(id);
            if (!success) return NotFound();
            return Ok(new { message = "Model deleted" });
        }

        [HttpGet("filter-models")]
        public IActionResult GetModelFromBrandAndType([FromQuery] int? brandId, [FromQuery] int? typeId, [FromQuery] int? stationId)
        {
            var models = _service.GetModelsByFiltersAsync(brandId, typeId, stationId)
                .GetAwaiter().GetResult();
            return Ok(models);
        }

        [HttpPost("check-available")]
        public IActionResult CheckAvailability([FromBody] AvailableVehicle dto)
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
