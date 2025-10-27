namespace PublicCarRental.Application.DTOs.AdminDashboard.Rate
{
    public class RatingAnalyticsDto
    {
        public int TotalRatings { get; set; }
        public double AverageRating { get; set; }
        public List<RatingDistributionDto> RatingDistribution { get; set; }
        public List<RatingCommentDto> RecentComments { get; set; }
        public List<ModelRatingPerformanceDto> TopPerformingModels { get; set; }
        public List<ModelRatingPerformanceDto> MostReviewedModels { get; set; }
        public int TotalModelsRated { get; set; }
        public ModelRatingPerformanceDto BestRatedModel { get; set; }
        public ModelRatingPerformanceDto MostReviewedModel { get; set; }
    }
}
