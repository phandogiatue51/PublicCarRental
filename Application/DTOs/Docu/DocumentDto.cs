using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Docu
{
    public class DocumentDto
    {
        public int DocumentId { get; set; }
        public DocumentType Type { get; set; }
        public string FileUrl { get; set; }
        public DocumentSide Side { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public DateTime UploadedAt { get; set; }
        public bool IsVerified { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public string DocumentNumber {  get; set; }
    }
}
