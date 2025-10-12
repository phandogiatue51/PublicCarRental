namespace PublicCarRental.Application.DTOs.Docu
{
    public class UploadStaffDocumentDto
    {
        public IFormFile IdentityCardFront { get; set; }
        public IFormFile IdentityCardBack { get; set; }
    }
}
