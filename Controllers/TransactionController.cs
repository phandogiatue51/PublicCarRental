using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Service.Trans;

namespace PublicCarRental.Controllers
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
