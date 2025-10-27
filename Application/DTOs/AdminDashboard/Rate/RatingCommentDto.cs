namespace PublicCarRental.Application.DTOs.AdminDashboard.Rate
{
    public class RatingCommentDto
    {
        public string RenterName { get; set; }
        public string Comment { get; set; }
        public int Stars { get; set; }
        public DateTime CreatedAt { get; set; }
        public string VehicleModel { get; set; }
        public string Brand { get; set; }
    }
}
