using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.Service.Trans;

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
    }
}
