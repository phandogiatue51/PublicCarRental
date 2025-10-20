using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Trans;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _service;
        private readonly IContractService _contractService;
        private readonly ITransactionService _transactionService;
        public InvoiceController(IInvoiceService service, IContractService contractService, ITransactionService transactionService)
        {
            _service = service;
            _contractService = contractService;
            _transactionService = transactionService;
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
    }
}
