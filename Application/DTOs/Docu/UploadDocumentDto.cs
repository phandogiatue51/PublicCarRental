using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Docu
{
    public class UploadDocumentDto
    {
        public IFormFile File { get; set; }
        public DocumentType Type { get; set; }
        public DocumentSide Side { get; set; }
        public string DocumentNumber { get; set; }
    }
}
