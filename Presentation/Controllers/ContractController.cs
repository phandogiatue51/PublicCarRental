using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.PDF;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContractController : ControllerBase
    {
        private readonly IContractService _contractService;
        private readonly IPdfStorageService _pdfStorageService;
        public ContractController(IContractService contractService, IPdfStorageService pdfStorageService)
        {
            _contractService = contractService;
            _pdfStorageService = pdfStorageService;
        }

        [HttpGet("all")]
        public IActionResult GetAll()
        {
            var contracts = _contractService.GetAll();
            return Ok(contracts);
        }

        [HttpGet("{id:int}")]
        public IActionResult GetById(int id)
        {
            var contract = _contractService.GetById(id);
            if (contract == null) return NotFound();
            return Ok(contract);
        }

        [HttpPost("active-contract")]
        public async Task<IActionResult> ActiveContract([FromForm] ConfirmContractDto dto)
        {
            try
            {
                var success = await _contractService.StartRentalAsync(dto);
                if (!success) return NotFound("Contract not found");
                return Ok(new { message = "Handover confirmed", contractId = dto.ContractId });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("finish-contract")]
        public async Task<IActionResult> FinishContract([FromForm] FinishContractDto dto)
        {
            try
            {
                var success = await _contractService.ReturnVehicleAsync(dto);
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

        [HttpDelete("delete-contract/{id}")]
        public IActionResult DeleteContract(int id)
        {
            var result = _contractService.DeleteContract(id);
            if (result.Success) return Ok(result.Message);
            return BadRequest(result.Message);
        }

        [HttpGet("get-by-station/{stationId}")]
        public IActionResult GetByStationId(int stationId)
        {
            var contracts = _contractService.GetContractByStationId(stationId);
            return Ok(contracts);
        }

        [HttpGet("filter")]
        public IActionResult FilterContracts([FromQuery] int? stationId, [FromQuery] RentalStatus? status, 
            [FromQuery] int? renterId, [FromQuery] int? staffId, [FromQuery] int? vehicleId)
        {
            var contracts = _contractService.FilterContracts(stationId, status, renterId, staffId, vehicleId);
            return Ok(contracts);
        }

        [HttpGet("contracts/{contractId}/pdf")]
        [Authorize]
        public IActionResult DownloadContractPdf(int contractId)
        {
            var contract = _contractService.GetEntityById(contractId);

            if (contract == null)
                return NotFound("Contract not found");

            if (contract.Status != RentalStatus.Confirmed &&
                contract.Status != RentalStatus.Active &&
                contract.Status != RentalStatus.Completed)
                return BadRequest("Contract not confirmed or active");

            try
            {
                var pdfBytes = _pdfStorageService.GetContractPdf(contractId); 
                return File(pdfBytes, "application/pdf", $"contract-{contractId}.pdf");
            }
            catch (FileNotFoundException)
            {
                return NotFound("Contract PDF not found");
            }
        }
    }
}
