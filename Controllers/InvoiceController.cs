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

        [HttpPost("create-invoice/{contractId}")]
        public IActionResult Create(int contractId) 
        {
            var result = _service.CreateInvoice(contractId);
            if (result.Success) return Ok( result.Message);
            return BadRequest(result.Message);
        }
    }
}
