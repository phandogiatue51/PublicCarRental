using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Rate
{
    public class RatingStatisticsDto
    {
        public double? AverageRating { get; set; }
        public int TotalRatings { get; set; }
        public Dictionary<RatingLabel, int> StarDistribution { get; set; }
        public int? ModelId { get; set; }
        public int? RenterId { get; set; }
    }
}
