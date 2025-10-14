using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.Service;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Trans;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Presentation.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ContractController : ControllerBase
    {
        private readonly IContractService _contractService;
        private readonly ITransactionService _transactionService;
        private readonly PdfContractService _pdfService;
        private readonly PdfStorageService _pdfStorageService;

        public ContractController(IContractService contractService, ITransactionService transactionService, 
            PdfContractService pdfService, PdfStorageService pdfStorageService)
        {
            _contractService = contractService;
            _transactionService = transactionService;
            _pdfService = pdfService;
            _pdfStorageService = pdfStorageService;
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
        public async Task<IActionResult> CreateContractAsync([FromBody] CreateContractDto dto)
        {
            var result = await _contractService.CreateContractAsync(dto);

            if (result.Success)
            {
                return Ok(new
                {
                    message = result.Message,
                    result.contractId
                });
            }
            else
            {
                return BadRequest(new { error = result.Message });
            }
        }

        [HttpPost("update-contract/{id}")]
        public async Task<IActionResult> UpdateContractAsync(int id, [FromBody] UpdateContractDto dto)
        {
            var result = await _contractService.UpdateContractAsync(id, dto);
            if (result.Success)
            {
                return Ok(new { message = result.Message });
            }
            else
            {
                return BadRequest(new { error = result.Message });
            }
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

        [HttpGet("contracts/{contractId}/summary")]
        public IActionResult GetContractSummary(int contractId)
        {
            var contract = _contractService.GetEntityById(contractId);

            return Ok(new
            {
                contractId = contract.ContractId,
                renterName = contract.EVRenter.Account.FullName,
                vehicle = contract.Vehicle.LicensePlate,
                station = contract.Station.Name,
                period = $"{contract.StartTime:dd/MM/yyyy HH:mm} - {contract.EndTime:dd/MM/yyyy HH:mm}",
                totalCost = contract.TotalCost,
                terms = new[] {
                    "The renter is responsible for the vehicle during the rental period.",
                    "Any damages must be reported immediately.",
                    "Late returns will incur additional charges.",
                    "Electricity is the responsibility of the renter."
                }
            });
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
