using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Docu
{
    public class DocumentDto
    {
        public int DocumentId { get; set; }
        public int AccountId { get; set; }
        public DocumentType Type { get; set; }
        public string FileUrl { get; set; }
        public DocumentSide Side { get; set; }
        public bool IsVerified { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public int? VerifiedByStaffId { get; set; }
        public string? StaffName { get; set; }
        public string DocumentNumber {  get; set; }
    }
}
