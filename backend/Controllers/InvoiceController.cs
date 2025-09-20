using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.DTOs;
using PublicCarRental.Models;
using PublicCarRental.Service.Inv;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _service;

        public InvoiceController(IInvoiceService service)
        {
            _service = service;
        }

        [HttpGet("all-invoices")]
        public IActionResult GetAll()
        {
            var invoices = _service.GetAllInvoices();
            return Ok(invoices);
        }

        [HttpGet("invoice/{id}")]
        public IActionResult GetById(int id)
        {
            var invoice = _service.GetInvoiceById(id);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpPost("create-invoice")]
        public IActionResult Create([FromBody] InvoiceCreateDto dto)
        {
            _service.CreateInvoice(dto.ContractId, dto.AmountDue);
            return Ok(new { message = "Invoice created" });
        }

        [HttpPost("pay-invoice/{id}")]
        public IActionResult PayInvoice(int id)
        {
            var invoice = _service.GetInvoiceById(id);
            if (invoice == null) return NotFound();

            invoice.Status = InvoiceStatus.Paid;
            invoice.AmountPaid = invoice.AmountDue;
            invoice.PaidAt = DateTime.UtcNow;

            var success = _service.UpdateInvoice(id, invoice);
            if (!success) return BadRequest("Failed to update invoice");

            return Ok(new { message = "Invoice marked as paid" });
        }
    }
}
