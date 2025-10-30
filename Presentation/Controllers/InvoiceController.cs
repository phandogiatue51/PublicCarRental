using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Redis;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _service;
        private readonly IBookingService _bookingService;
        private readonly IDistributedLockService _distributedLock;


        public InvoiceController(IInvoiceService service, IBookingService bookingService, IDistributedLockService distributedLockService)
        {
            _service = service;
            _distributedLock = distributedLockService;
            _bookingService = bookingService;
        }

        [HttpGet("all-invoices")]
        public IActionResult GetAll()
        {
            var invoices = _service.GetAll();
            return Ok(invoices);
        }

        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            var invoice = _service.GetById(id);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpGet("by-contract/{contractId}")]
        public IActionResult GetByContractId(int contractId)
        {
            var invoice = _service.GetByContractId(contractId);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpGet("by-order-code/{orderCode}")]
        public IActionResult GetByOrderCode(int orderCode)
        {
            var invoice = _service.GetByOrderCode(orderCode);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpGet("get-by-station/{stationId}")]
        public IActionResult GetByStation(int stationId)
        {
            var invoices = _service.GetInvoiceByStationId(stationId);
            return Ok(invoices);
        }
      [HttpGet("filter")]
        public IActionResult FilterInvoices(
            [FromQuery] int? contractId,
            [FromQuery] int? orderCode,
            [FromQuery] int? stationId)
        {
            try
            {
                var result = _service.FilterInvoices(contractId, orderCode, stationId);
                return Ok(result);
            }
            catch
            {
                return StatusCode(500, "Internal server error while filtering invoices");
            }
        }

        [HttpDelete("cancel-invoice/{orderCode}")]
        public async Task<IActionResult> CancelInvoiceAsync(int orderCode)
        {
            var invoice = _service.GetInvoiceByOrderCode(orderCode);
            if (invoice == null) return NotFound();

            if (!string.IsNullOrEmpty(invoice.BookingToken))
            {
                var bookingRequest = await _bookingService.GetBookingRequest(invoice.BookingToken);
                if (bookingRequest != null)
                {
                    var lockKey = $"vehicle_booking:{bookingRequest.VehicleId}:{bookingRequest.StartTime:yyyyMMddHHmm}_{bookingRequest.EndTime:yyyyMMddHHmm}";
                    _distributedLock.ReleaseLock(lockKey, invoice.BookingToken);
                }

                await _bookingService.RemoveBookingRequest(invoice.BookingToken);
            }
            var success = _service.DeleteInvoice(invoice);
            if (!success) return NotFound();
            return Ok();
        }
    }
}
