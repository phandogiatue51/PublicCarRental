using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Docu
{
    public class VerifyDocumentsDto
    {
        public int RenterId { get; set; }
        public DocumentType? DocumentType { get; set; }
    }
}
