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

        [HttpGet("{id}")]
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

        [HttpPost("create-invoice/{contractId}")]
        public IActionResult Create(int contractId) 
        {
            var result = _service.CreateInvoice(contractId);
            if (result.Success) return Ok( result.Message);
            return BadRequest(result.Message);
        }

        [HttpGet("get-by-station/{stationId}")]
        public IActionResult GetByStation(int stationId)
        {
            var invoices = _service.GetInvoiceByStationId(stationId);
            return Ok(invoices);
        }
    }
}
