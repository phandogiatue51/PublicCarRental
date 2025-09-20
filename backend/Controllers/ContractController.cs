using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.DTOs;
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
        public async Task<IActionResult> GetAllContracts()
        {
            var contracts = _contractService.GetAllContracts();
            return Ok(contracts);
        }

        [HttpPost("create-contract")]
        public IActionResult CreateContract([FromBody] RentRequestDto dto)
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

        [HttpPost("confirm-contract")]
        public IActionResult ConfirmContract([FromBody] HandoverDto dto)
        {
            try
            {
                var success = _contractService.ConfirmContract(dto);
                if (!success) return NotFound("Contract not found");
                return Ok(new { message = "Handover confirmed", contractId = dto.ContractId });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("return-vehicle")]
        public IActionResult ReturnVehicle([FromBody] ReturnDto dto)
        {
            try
            {
                var success = _contractService.ReturnVehicle(dto);
                if (!success)
                    return NotFound(new { message = "Contract not found or vehicle missing" });

                var contract = _contractService.GetContractById(dto.ContractId);
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
