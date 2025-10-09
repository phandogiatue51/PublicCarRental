using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Docu;

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

        [HttpGet("{accountId}")]
        public async Task<IActionResult> GetByAccountId(int accountId)
        {
            var result = await _documentService.GetUserDocumentsAsync(accountId);
            return Ok(result);
        }

        [HttpPost("upload-staff-id")]
        public async Task<IActionResult> UploadStaffIdentityCard([FromQuery] int staffAccountId, [FromForm] UploadDocumentDto dto)
        {
            var result = await _documentService.UploadStaffIdentityCardAsync(staffAccountId, dto);
            return Ok(new { success = result });
        }

        [HttpPost("upload-renter/{accountId}")]
        public async Task<IActionResult> UploadDocument(int accountId, [FromForm] UploadDocumentDto dto)
        {
            var result = await _documentService.UploadDocumentAsync(accountId, dto);
            return Ok(result);
        }

        [HttpPost("upload-renter-all/{accountId}")]
        public async Task<IActionResult> UploadAllDocuments(int accountId, [FromForm] UploadRenterDocumentsDto dto)
        {
            var result = await _documentService.UploadRenterDocumentsAsync(accountId, dto);
            return Ok(new { success = result });
        }

        [HttpPost("staff-verify-renter/{staffId}")]
        public async Task<IActionResult> VerifyRenterDocuments(int staffId, [FromBody] VerifyDocumentsDto dto)
        {
            var result = await _documentService.VerifyDocumentsAsync(dto.AccountId, staffId, dto.DocumentType);
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
