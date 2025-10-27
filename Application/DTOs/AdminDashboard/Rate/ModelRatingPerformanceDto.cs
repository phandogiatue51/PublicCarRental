namespace PublicCarRental.Application.DTOs.AdminDashboard.Rate
{
    public class ModelRatingPerformanceDto
    {
        public int ModelId { get; set; }
        public string ModelName { get; set; }
        public string BrandName { get; set; }
        public int TotalRatings { get; set; }
        public double AverageRating { get; set; }
        public int FiveStarCount { get; set; }
        public int FourStarCount { get; set; }
        public int ThreeStarCount { get; set; }
        public int TwoStarCount { get; set; }
        public int OneStarCount { get; set; }
        public double PositiveRatingPercentage { get; set; }
    }
}
