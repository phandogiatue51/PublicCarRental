using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs.Docu;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Ren;
using PublicCarRental.Infrastructure.Data.Repository.Staf;

public interface IDocumentService
{
    Task<(bool Success, string Message)> UploadDocumentAsync(int accountId, UploadDocumentDto dto);
    Task<List<DocumentDto>> GetUserDocumentsAsync(int id, AccountRole role);
    Task<(bool Success, string Message)> UploadRenterDocumentsAsync(int renterAccountId, UploadRenterDocumentsDto dto);
    Task<bool> VerifyDocumentsAsync(int accountId, int staffVerifierId, DocumentType? documentType = null);
    Task<bool> DeleteDocumentAsync(int documentId);
    Task<List<DocumentDto>> GetAllDocumentsByStatusAsync(bool? isVerified = null);
    Task<IEnumerable<DocumentDto>> GetAllAsync();
    Task<(bool Success, string Message)> UploadStaffIdentityCardAsync(int staffId, UploadStaffDocumentDto dto);

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

    public async Task<(bool Success, string Message)> UploadDocumentAsync(int accountId, UploadDocumentDto dto)
    {
        try
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
                StaffId = null
            };

            _documentRepository.CreateDocument(document);
            return (true, "Uploaded successfully!");
        } catch (Exception ex)
        {
            return (false, ex.ToString());
        }
    }

    public async Task<List<DocumentDto>> GetUserDocumentsAsync(int id, AccountRole role)
    {
        var accountId = 0;
        if (role == AccountRole.EVRenter)
        {
            var renter = _eVRenterRepository.GetById(id);
            accountId = renter.AccountId;
        }
        else if (role == AccountRole.Staff)
        {
            var staff = _staffRepository.GetById(id);
            accountId = staff.AccountId;
        }

        var query = _documentRepository.GetAll().Where(d => d.AccountId == accountId);

        var documents = query.OrderByDescending(d => d.UploadedAt).ToList();
        return documents.Select(MapToDto).ToList();
    }

    public async Task<(bool Success, string Message)> UploadRenterDocumentsAsync(int renterId, UploadRenterDocumentsDto dto)
    {
        try
        {
            var renter = _eVRenterRepository.GetById(renterId);
            var renterAccountId = renter.AccountId;

            await UploadDocumentAsync(renterAccountId, new UploadDocumentDto
            {
                File = dto.DriverLicenseFront,
                Type = DocumentType.DriverLicense,
                Side = DocumentSide.Front,
                DocumentNumber = renter.LicenseNumber
            });

            await UploadDocumentAsync(renterAccountId, new UploadDocumentDto
            {
                File = dto.DriverLicenseBack,
                Type = DocumentType.DriverLicense,
                Side = DocumentSide.Back,
                DocumentNumber = renter.LicenseNumber
            });

            await UploadDocumentAsync(renterAccountId, new UploadDocumentDto
            {
                File = dto.IdentityCardFront,
                Type = DocumentType.IdentityCard,
                Side = DocumentSide.Front,
                DocumentNumber = renter.Account.IdentityCardNumber
            });

            await UploadDocumentAsync(renterAccountId, new UploadDocumentDto
            {
                File = dto.IdentityCardBack,
                Type = DocumentType.IdentityCard,
                Side = DocumentSide.Back,
                DocumentNumber = renter.Account.IdentityCardNumber
            });
            return (true, "Uploaded Renter ID successfully!");
        } catch (Exception ex)
        {
            return (false,  ex.ToString());
        }
    }

    public async Task<bool> VerifyDocumentsAsync(int renterId, int staffVerifierId, DocumentType? documentType = null)
    {
        var renter = _eVRenterRepository.GetById(renterId);
        var accountId = renter.AccountId;

        var documents = _documentRepository.GetAll()
            .Where(d => d.AccountId == accountId && !d.IsVerified);

        if (documentType.HasValue)
            documents = documents.Where(d => d.Type == documentType.Value);

        var documentList = documents.ToList(); 

        foreach (var doc in documentList)
        {
            doc.IsVerified = true;
            doc.VerifiedAt = DateTime.UtcNow;
            doc.StaffId = staffVerifierId;
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
        return new DocumentDto
        {
            DocumentId = document.DocumentId,
            AccountId = document.AccountId,
            Type = document.Type,
            FileUrl = document.FileUrl,
            Side = document.Side,
            DocumentNumber = document.DocumentNumber,
            IsVerified = document.IsVerified,
            StaffId = document.StaffId,
            StaffName = document.Staff?.Account?.FullName
        };
    }

    public async Task<(bool Success, string Message)> UploadStaffIdentityCardAsync(int staffId, UploadStaffDocumentDto dto)
    {
        try
        {
            var staff = _staffRepository.GetById(staffId);

            await UploadDocumentAsync(staff.AccountId, new UploadDocumentDto
            {
                File = dto.IdentityCardFront,
                Type = DocumentType.IdentityCard,
                Side = DocumentSide.Front,
                DocumentNumber = staff.Account.IdentityCardNumber
            });

            await UploadDocumentAsync(staff.AccountId, new UploadDocumentDto
            {
                File = dto.IdentityCardBack,
                Type = DocumentType.IdentityCard,
                Side = DocumentSide.Back,
                DocumentNumber = staff.Account.IdentityCardNumber
            });
            return (true, "Uploaded Staff ID successfully!");
        } catch (Exception ex)
        {
            return (false, ex.ToString());
        }
    }



}