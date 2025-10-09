using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Infrastructure.Data.Models;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin,Staff")]
public class DocumentVerificationController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentVerificationController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpGet("pending-verifications")]
    public async Task<IActionResult> GetPendingVerifications(DocumentType? documentType = null)
    {
        var allDocuments = await _documentService.GetAllUnverifiedDocumentsAsync(documentType);
        return Ok(allDocuments);
    }

    [HttpPost("verify/{accountId}")]
    public async Task<IActionResult> VerifyUserDocuments(int accountId, int staffId, DocumentType? documentType = null)
    {
        await _documentService.VerifyDocumentsAsync(accountId, staffId, documentType);
        return Ok(new { message = "Documents verified successfully" });
    }
}