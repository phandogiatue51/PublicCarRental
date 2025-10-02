using PublicCarRental.Models;

namespace PublicCarRental.DTOs
{
    public class FavoriteStatsDto
    {
        public VehicleModel Model { get; set; }
        public int Count { get; set; }
    }
}
