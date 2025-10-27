namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class RatingAnalyticsDto
    {
        public int TotalRatings { get; set; }
        public double AverageRating { get; set; }
        public List<RatingDistributionDto> RatingDistribution { get; set; }
        public List<RatingCommentDto> RecentComments { get; set; }
    }
}
