using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Rate
{
    public class CreateRatingDto
    {
        public int ContractId { get; set; }
        public int RenterId { get; set; }
        public RatingLabel Stars { get; set; }
        public string Comment { get; set; }
    }
}
