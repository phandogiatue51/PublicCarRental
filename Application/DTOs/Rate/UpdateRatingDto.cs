using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Rate
{
    public class UpdateRatingDto
    {
        public RatingLabel Stars { get; set; }
        public string Comment { get; set; }
    }
}
