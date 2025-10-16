using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Cont;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly ILogger<BookingController> _logger;

        public BookingController(IBookingService bookingService, ILogger<BookingController> logger)
        {
            _bookingService = bookingService;
            _logger = logger;
        }

        [HttpPost("request")]
        public async Task<IActionResult> CreateBookingRequestAsync([FromBody] CreateContractDto dto)
        {
            try
            {
                var result = await _bookingService.CreateBookingRequestAsync(dto);

                if (!result.Success)
                    return BadRequest(new { message = result.Message });

                return Ok(new
                {
                    message = result.Message,
                    invoiceId = result.InvoiceId,
                    bookingToken = result.BookingToken
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating booking request");
                return BadRequest(new { message = "Error creating booking request" });
            }
        }

        [HttpGet("summary/{bookingToken}")]
        public async Task<IActionResult> GetBookingSummary(string bookingToken)
        {
            var bookingRequest = await _bookingService.GetBookingRequest(bookingToken);
            if (bookingRequest == null)
                return NotFound("Booking request not found or expired");

            return Ok(new
            {
                bookingToken = bookingRequest.BookingToken,
                stationId = bookingRequest.StationId,
                period = $"{bookingRequest.StartTime:dd/MM/yyyy HH:mm} - {bookingRequest.EndTime:dd/MM/yyyy HH:mm}",
                totalCost = bookingRequest.TotalCost,
                terms = new[] {
                    "The renter is responsible for the vehicle during the rental period.",
                    "Any damages must be reported immediately.",
                    "Late returns will incur additional charges.",
                    "Electricity is the responsibility of the renter."
                }
            });
        }
    }
}
