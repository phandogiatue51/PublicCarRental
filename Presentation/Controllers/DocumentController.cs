using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Docu;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Presentation.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentController : ControllerBase
    {
        private readonly IDocumentService _documentService;

        public DocumentController(IDocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            var result = await _documentService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("get-by-renter-id/{renterId}")]
        public async Task<IActionResult> GetByRenterId(int renterId)
        {
            var role = AccountRole.EVRenter;
            var result = await _documentService.GetUserDocumentsAsync(renterId, role);
            return Ok(result);
        }

        [HttpGet("get-by-staff-id/{staffId}")]
        public async Task<IActionResult> GetByStaffId(int staffId)
        {
            var role = AccountRole.Staff;
            var result = await _documentService.GetUserDocumentsAsync(staffId, role);
            return Ok(result);
        }

        [HttpPost("upload-staff-id")]
        public async Task<IActionResult> UploadStaffIdentityCard([FromQuery] int staffId, [FromForm] UploadStaffDocumentDto dto)
        {
            var result = await _documentService.UploadStaffIdentityCardAsync(staffId, dto);
            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        [HttpPost("upload-renter-all/{renterId}")]
        public async Task<IActionResult> UploadAllDocuments(int renterId, [FromForm] UploadRenterDocumentsDto dto)
        {
            var result = await _documentService.UploadRenterDocumentsAsync(renterId, dto);
            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        [HttpPost("staff-verify-renter/{staffId}")]
        public async Task<IActionResult> VerifyRenterDocuments(int staffId, [FromBody] VerifyDocumentsDto dto)
        {
            var result = await _documentService.VerifyDocumentsAsync(dto.RenterId, staffId, dto.DocumentType);
            return Ok(new { success = result });
        }

        [HttpGet("filter-document")]
        public async Task<IActionResult> GetDocuments([FromQuery] bool? isVerified = null)
        {
            var result = await _documentService.GetAllDocumentsByStatusAsync(isVerified);
            return Ok(result);
        }
    }
}
