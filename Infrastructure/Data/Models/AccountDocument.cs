namespace PublicCarRental.Infrastructure.Data.Models
{
    public class AccountDocument
    {
        public int DocumentId { get; set; }

        public int AccountId { get; set; }
        public Account Account { get; set; }

        public DocumentType Type { get; set; }
        public string FileUrl { get; set; }
        public DocumentSide Side { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public bool IsVerified { get; set; } = false;
        public DateTime? VerifiedAt { get; set; }
        public string? DocumentNumber { get; set; }
        public Staff? Staff { get; set; }

    }

    public enum DocumentType
    {
        DriverLicense,    
        IdentityCard,     
    }

    public enum DocumentSide
    {
        Front,
        Back,
    }
}
