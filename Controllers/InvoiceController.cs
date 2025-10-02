using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;
using PublicCarRental.Service.Cont;
using PublicCarRental.Service.Inv;
using PublicCarRental.Service.Trans;

namespace PublicCarRental.Controllers
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

        [HttpPost("create-invoice")]
        public IActionResult Create([FromBody] InvoiceCreateDto dto)
        {
            _service.CreateInvoice(dto);
            return Ok(new { message = "Invoice created" });
        }
    }
}
