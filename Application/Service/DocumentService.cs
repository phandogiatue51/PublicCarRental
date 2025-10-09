using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs.Docu;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Ren;
using PublicCarRental.Infrastructure.Data.Repository.Staf;

public interface IDocumentService
{
    Task<DocumentDto> UploadDocumentAsync(int accountId, UploadDocumentDto dto);
    Task<List<DocumentDto>> GetUserDocumentsAsync(int accoundId);
    Task<bool> UploadRenterDocumentsAsync(int renterAccountId, UploadRenterDocumentsDto dto);
    Task<bool> VerifyDocumentsAsync(int accountId, int staffVerifierId, DocumentType? documentType = null);
    Task<bool> DeleteDocumentAsync(int documentId);
    Task<List<DocumentDto>> GetAllDocumentsByStatusAsync(bool? isVerified = null);
    Task<IEnumerable<DocumentDto>> GetAllAsync();
    Task<bool> UploadStaffIdentityCardAsync(int staffAccountId, UploadDocumentDto dto);

}

public class DocumentService : IDocumentService
{
    private readonly IImageStorageService _imageService;
    private readonly IDocumentRepository _documentRepository;
    private readonly IEVRenterRepository _eVRenterRepository;
    private readonly IStaffRepository _staffRepository;

    public DocumentService(IImageStorageService imageService, IDocumentRepository documentRepository
        , IEVRenterRepository eVRenterRepository, IStaffRepository staffRepository)
    {
        _imageService = imageService;
        _documentRepository = documentRepository;
        _eVRenterRepository = eVRenterRepository;
        _staffRepository = staffRepository;
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
            IsVerified = false,
            VerifiedByStaffId = null
        };

        _documentRepository.CreateDocument(document);

        return MapToDto(document);
    }

    public async Task<List<DocumentDto>> GetUserDocumentsAsync(int accountId)
    {
        var query = _documentRepository.GetAll().Where(d => d.AccountId == accountId);

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

    public async Task<List<DocumentDto>> GetAllDocumentsByStatusAsync(bool? isVerified = null)
    {
        var query = _documentRepository.GetAll();
        if (isVerified.HasValue)
        {
            query = query.Where(d => d.IsVerified == isVerified.Value);
        }

        var documents = await query
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();

        return documents.Select(MapToDto).ToList();
    }

    public async Task<IEnumerable<DocumentDto>> GetAllAsync()
    {
        var documents = _documentRepository.GetAll()
            .Select(MapToDto).ToList();
        return documents;
    }

    private DocumentDto MapToDto(AccountDocument document)
    {
        string staffName = null;

        if (document.VerifiedByStaffId.HasValue)
        {
            var staff = _staffRepository.GetById(document.VerifiedByStaffId.Value);
            staffName = staff?.Account?.FullName;
        }
        return new DocumentDto
        {
            DocumentId = document.DocumentId,
            AccountId = document.AccountId,
            Type = document.Type,
            FileUrl = document.FileUrl,
            Side = document.Side,
            DocumentNumber = document.DocumentNumber,
            IsVerified = document.IsVerified,
            VerifiedByStaffId = document.VerifiedByStaffId,
            StaffName = staffName,
        };
    }

    public async Task<bool> UploadStaffIdentityCardAsync(int staffAccountId, UploadDocumentDto dto)
    {
        var fileUrl = await _imageService.UploadImageAsync(dto.File);

        var document = new AccountDocument
        {
            AccountId = staffAccountId,
            Type = dto.Type,
            FileUrl = fileUrl,
            Side = dto.Side,
            DocumentNumber = dto.DocumentNumber,
            UploadedAt = DateTime.UtcNow,
            IsVerified = true,
            VerifiedAt = DateTime.UtcNow,
        };

        _documentRepository.CreateDocument(document);
        return true;
    }
}