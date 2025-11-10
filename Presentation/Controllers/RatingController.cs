using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Rate;
using PublicCarRental.Application.Service;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RatingsController : ControllerBase
    {
        private readonly IRatingService _ratingService;
        private readonly ILogger<RatingsController> _logger;

        public RatingsController(IRatingService ratingService, ILogger<RatingsController> logger)
        {
            _ratingService = ratingService;
            _logger = logger;
        }

        [HttpGet]
        public IActionResult GetAllRatings()
        {
            var ratings = _ratingService.GetAllRatings();
            return Ok(ratings);
        }

        [HttpGet("{id}")]
        public IActionResult GetRatingById(int id)
        {
            var rating = _ratingService.GetRatingById(id);
            if (rating == null) return NotFound($"Rating with ID {id} not found");
            return Ok(rating);
        }

        [HttpPost]
        public IActionResult CreateRating([FromBody] CreateRatingDto createDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = _ratingService.CreateRating(createDto);
            if (!result.Success) return BadRequest(result.Message);

            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        public IActionResult UpdateRating(int id, [FromBody] UpdateRatingDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = _ratingService.UpdateRating(id, updateDto);
            if (!result.Success) return NotFound(result.Message);

            return Ok(new { message = result.Message });
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteRating(int id)
        {
            var result = _ratingService.DeleteRating(id);
            if (!result.Success) return NotFound(result.Message);

            return NoContent();
        }

        [HttpGet("contract/{contractId}")]
        public IActionResult GetRatingsByContract(int contractId)
        {
            var ratings = _ratingService.GetRatingsByContractId(contractId);
            return Ok(ratings);
        }

        [HttpGet("renter/{renterId}")]
        public IActionResult GetRatingsByRenter(int renterId)
        {
            var ratings = _ratingService.GetRatingsByRenterId(renterId);
            return Ok(ratings);
        }

        [HttpGet("model/{modelId}")]
        public IActionResult GetRatingsByModel(int modelId)
        {
            var ratings = _ratingService.GetRatingsByModelId(modelId);
            return Ok(ratings);
        }

        [HttpGet("vehicle/{vehicleId}")]
        public IActionResult GetRatingsByVehicle(int vehicleId)
        {
            var ratings = _ratingService.GetRatingsByVehicleId(vehicleId);
            return Ok(ratings);
        }

        [HttpGet("model/{modelId}/statistics")]
        public IActionResult GetModelRatingStatistics(int modelId)
        {
            var statistics = _ratingService.GetRatingStatisticsByModelId(modelId);
            return Ok(statistics);
        }

        [HttpGet("renter/{renterId}/statistics")]
        public IActionResult GetRenterRatingStatistics(int renterId)
        {
            var statistics = _ratingService.GetRatingStatisticsByRenterId(renterId);
            return Ok(statistics);
        }

        [HttpGet("recent")]
        public IActionResult GetRecentRatings([FromQuery] int count = 10)
        {
            var ratings = _ratingService.GetRecentRatings(count);
            return Ok(ratings);
        }

        [HttpGet("stars/{starRating}")]
        public IActionResult GetRatingsByStar(RatingLabel starRating)
        {
            var ratings = _ratingService.GetRatingsByStar(starRating);
            return Ok(ratings);
        }

        [HttpGet("contract/{contractId}/can-rate/{renterId}")]
        public IActionResult CanRenterRateContract(int contractId, int renterId)
        {
            var canRate = _ratingService.CanRenterRateContract(contractId, renterId);
            return Ok(new { canRate });
        }

        [HttpGet("contract/{contractId}/has-rated/{renterId}")]
        public IActionResult HasRenterRatedContract(int contractId, int renterId)
        {
            var hasRated = _ratingService.HasRenterRatedContract(contractId, renterId);
            return Ok(new { hasRated });
        }

        [HttpGet("filter")]
        public IActionResult GetFilteredRatings([FromQuery] int? modelId = null, [FromQuery] int? renterId = null, [FromQuery] RatingLabel? starRating = null)
        {
            try
            {
                var ratings = _ratingService.GetFilteredRatings(modelId, renterId, starRating);
                return Ok(ratings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering ratings");
                return StatusCode(500, "An error occurred while filtering ratings");
            }
        }
    }
}