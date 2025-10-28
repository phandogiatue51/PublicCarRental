using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Rate
{
    public class RatingReadDto
    {
        public int RatingId { get; set; }
        public int ContractId { get; set; }
        public RatingLabel Stars { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }

        public int RenterId { get; set; }
        public string RenterName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}
