using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Mod;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Application.Service.Mod;
using PublicCarRental.Application.Service.Veh;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ModelController : ControllerBase
    {
        private readonly IModelService _service;
        private readonly IVehicleService _vehicleService;
        private readonly ILogger<ModelController> _logger;

        public ModelController(IModelService service, IVehicleService vehicleService, ILogger<ModelController> logger)
        {
            _service = service;
            _vehicleService = vehicleService;
            _logger = logger;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            var models = await _service.GetAllModelsAsync();
            return Ok(models);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetByIdAsync(int id)
        {
            var model = await _service.GetByIdAsync(id);
            if (model == null) return NotFound();
            return Ok(model);
        }

        [HttpPost("create-model")]
        public async Task<IActionResult> Create([FromForm] ModelCreateDto dto)
        {
            if (dto == null) return BadRequest("DTO is null");
            if (string.IsNullOrEmpty(dto.Name)) return BadRequest("Name is required");

            var modelId = await _service.CreateModelAsync(dto, dto.ImageFile);
            return Ok(new { message = "Model created", modelId });
        }

        [HttpPut("update-model/{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] ModelCreateDto model)
        {
            var success = await _service.UpdateModelAsync(id, model, model.ImageFile);
            return success ? Ok(new { message = "Model updated" }) : NotFound();
        }

        [HttpDelete("delete-model/{id}")]
        public async Task<IActionResult> DeleteAsync(int id)
        {
            var success = await _service.DeleteModelAsync(id);
            if (!success) return NotFound();
            return Ok(new { message = "Model deleted" });
        }

        [HttpGet("filter-models")]
        public async Task<IActionResult> GetModelFromBrandAndTypeAsync([FromQuery] int? brandId, [FromQuery] int? typeId, [FromQuery] int? stationId)
        {
            var models = await _service.GetModelsByFiltersAsync(brandId, typeId, stationId);
            return Ok(models);
        }

        [HttpGet("get-station-from-model/{modelId}")]
        public async Task<IActionResult> GetStationAsync(int modelId)
        {
            var models = await _vehicleService.GetStationFromModelAsync(modelId);
            return Ok(models);
        }

        [HttpPost("get-available-count")]
        public async Task<ActionResult<int>> GetAvailableCount([FromBody] AvailableVehicle dto)
        {
            try
            {
                var count = await _vehicleService.GetAvailableVehicleCountByModelAsync(
                    dto.ModelId, dto.StationId, dto.StartTime, dto.EndTime);
                return Ok(count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available count");
                return StatusCode(500, "Error checking availability");
            }
        }
    }
}
