using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.Service;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionController : ControllerBase
    {
        private readonly ITransactionService _transactionSerivce;
        public TransactionController (ITransactionService transactionService)
        {
            _transactionSerivce = transactionService;
        }

        [HttpGet("get-all")]
        public IActionResult GetAll()
        {
            var models = _transactionSerivce.GetAll();
            return Ok(models);
        }

        [HttpPost("create/{invoiceId}")]
        public IActionResult CreateTransaction(int invoiceId)
        {
            string note = $"Payment received for invoice #{invoiceId} created!";
            _transactionSerivce.CreateTransaction(invoiceId, TransactionType.Income, note);
            return Ok();
        }
    }
}
