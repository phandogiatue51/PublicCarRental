namespace PublicCarRental.Application.DTOs.Docu
{
    public class UploadRenterDocumentsDto
    {
        public IFormFile DriverLicenseFront { get; set; }
        public IFormFile DriverLicenseBack { get; set; }
        public IFormFile IdentityCardFront { get; set; }
        public IFormFile IdentityCardBack { get; set; }
        public string LicenseNumber { get; set; }
        public string IdentityCardNumber { get; set; } 
    }
}
