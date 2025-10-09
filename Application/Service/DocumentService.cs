using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs.Docu;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Infrastructure.Data.Models;

public interface IDocumentService
{
    Task<DocumentDto> UploadDocumentAsync(int accountId, UploadDocumentDto dto);
    Task<List<DocumentDto>> GetUserDocumentsAsync(int accountId, DocumentType? type = null);
    Task<bool> UploadRenterDocumentsAsync(int renterAccountId, UploadRenterDocumentsDto dto);
    Task<bool> VerifyDocumentsAsync(int accountId, int staffVerifierId, DocumentType? documentType = null);
    Task<bool> DeleteDocumentAsync(int documentId);
    Task<List<DocumentDto>> GetAllUnverifiedDocumentsAsync(DocumentType? type = null);
}

public class DocumentService : IDocumentService
{
    private readonly IImageStorageService _imageService;
    private readonly IDocumentRepository _documentRepository;

    public DocumentService(IImageStorageService imageService, IDocumentRepository documentRepository)
    {
        _imageService = imageService;
        _documentRepository = documentRepository;
    }

    public async Task<DocumentDto> UploadDocumentAsync(int accountId, UploadDocumentDto dto)
    {
        var fileUrl = await _imageService.UploadImageAsync(dto.File);

        var document = new AccountDocument
        {
            AccountId = accountId,
            Type = dto.Type,
            FileUrl = fileUrl,
            Side = dto.Side,
            DocumentNumber = dto.DocumentNumber,
            UploadedAt = DateTime.UtcNow,
            IsVerified = false
        };

        _documentRepository.CreateDocument(document);

        return MapToDto(document);
    }

    public async Task<List<DocumentDto>> GetUserDocumentsAsync(int accountId, DocumentType? type = null)
    {
        var query = _documentRepository.GetAll().Where(d => d.AccountId == accountId);

        if (type.HasValue)
            query = query.Where(d => d.Type == type.Value);

        var documents = query.OrderByDescending(d => d.UploadedAt).ToList();
        return documents.Select(MapToDto).ToList();
    }

    public async Task<bool> UploadRenterDocumentsAsync(int renterAccountId, UploadRenterDocumentsDto dto)
    {
        await UploadDocumentAsync(renterAccountId, new UploadDocumentDto
        {
            File = dto.DriverLicenseFront,
            Type = DocumentType.DriverLicense,
            Side = DocumentSide.Front,
            DocumentNumber = dto.LicenseNumber
        });

        await UploadDocumentAsync(renterAccountId, new UploadDocumentDto
        {
            File = dto.DriverLicenseBack,
            Type = DocumentType.DriverLicense,
            Side = DocumentSide.Back,
            DocumentNumber = dto.LicenseNumber
        });

        await UploadDocumentAsync(renterAccountId, new UploadDocumentDto
        {
            File = dto.IdentityCardFront,
            Type = DocumentType.IdentityCard,
            Side = DocumentSide.Front,
            DocumentNumber = dto.IdentityCardNumber
        });

        await UploadDocumentAsync(renterAccountId, new UploadDocumentDto
        {
            File = dto.IdentityCardBack,
            Type = DocumentType.IdentityCard,
            Side = DocumentSide.Back,
            DocumentNumber = dto.IdentityCardNumber
        });

        return true;
    }

    public async Task<bool> VerifyDocumentsAsync(int accountId, int staffVerifierId, DocumentType? documentType = null)
    {
        var documents = _documentRepository.GetAll()
            .Where(d => d.AccountId == accountId && !d.IsVerified);

        if (documentType.HasValue)
            documents = documents.Where(d => d.Type == documentType.Value);

        var documentList = documents.ToList(); // Materialize the query

        foreach (var doc in documentList)
        {
            doc.IsVerified = true;
            doc.VerifiedAt = DateTime.UtcNow;
            doc.VerifiedByStaffId = staffVerifierId;
        }

        _documentRepository.UpdateRange(documentList);
        return true;
    }

    public async Task<bool> DeleteDocumentAsync(int documentId)
    {
        var document = _documentRepository.GetAll()
            .FirstOrDefault(d => d.DocumentId == documentId);
        if (document == null) return false;

        await _imageService.DeleteImageAsync(document.FileUrl);
        _documentRepository.DeleteDocument(document);

        return true;
    }
    public async Task<List<DocumentDto>> GetAllUnverifiedDocumentsAsync(DocumentType? type = null)
    {
        var query = _documentRepository.GetAll()
            .Where(d => !d.IsVerified)
            .Include(d => d.Account)
            .Where(d => !type.HasValue || d.Type == type.Value);

        var documents = await query
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();

        return documents.Select(d => new DocumentDto
        {
            DocumentId = d.DocumentId,
            Type = d.Type,
            FileUrl = d.FileUrl,
            Side = d.Side,
            DocumentNumber = d.DocumentNumber,
            UploadedAt = d.UploadedAt,
            IsVerified = d.IsVerified,
        }).ToList();
    }
    private DocumentDto MapToDto(AccountDocument document)
    {
        return new DocumentDto
        {
            DocumentId = document.DocumentId,
            Type = document.Type,
            FileUrl = document.FileUrl,
            Side = document.Side,
            DocumentNumber = document.DocumentNumber,
            UploadedAt = document.UploadedAt,
            IsVerified = document.IsVerified,
            VerifiedAt = document.VerifiedAt
        };
    }
}