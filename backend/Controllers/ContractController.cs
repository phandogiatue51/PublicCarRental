using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs.Cont;
using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;
using PublicCarRental.Service.Cont;

namespace PublicCarRental.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContractController : ControllerBase
    {
        private readonly IContractService _contractService;
        public ContractController(IContractService contractService)
        {
            _contractService = contractService;
        }

        [HttpGet("all")]
        public IActionResult GetAll()
        {
            var contracts = _contractService.GetAll();
            return Ok(contracts);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var contract = _contractService.GetById(id);
            if (contract == null) return NotFound();
            return Ok(contract);
        }

        [HttpPost("create-contract")]
        public IActionResult CreateContract([FromBody] CreateContractDto dto)
        {
            try
            {
                var contractId = _contractService.CreateContract(dto);
                return Ok(new { message = "Rental on Pending", contractId });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("update-contract/{id}")]
        public IActionResult UpdateContract(int id, [FromBody] UpdateContractDto dto)
        {
            try
            {
                var success = _contractService.UpdateContract(id, dto);
                if (!success) return NotFound("Contract not found");
                return Ok(new { message = "Contract updated", contractId = id });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("active-contract")]
        public IActionResult ActiveContract([FromBody] ConfirmContractDto dto)
        {
            try
            {
                var success = _contractService.StartRental(dto.ContractId, dto.StaffId);
                if (!success) return NotFound("Contract not found");
                return Ok(new { message = "Handover confirmed", contractId = dto.ContractId });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("finish-contract")]
        public IActionResult FinishContract([FromBody] InvoiceCreateDto dto)
        {
            try
            {
                var success = _contractService.ReturnVehicle(dto);
                if (!success)
                    return NotFound(new { message = "Contract not found or vehicle missing" });

                var contract = _contractService.GetEntityById(dto.ContractId);
                return Ok(new
                {
                    message = "Vehicle returned successfully",
                    contractId = contract.ContractId,
                    totalCost = contract.TotalCost,
                    vehicleStatus = contract.Vehicle.Status.ToString(),
                    contractStatus = contract.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Error during return", details = ex.Message });
            }
        }
    }
}
