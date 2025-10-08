using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs
{
    public class FavoriteStatsDto
    {
        public VehicleModel Model { get; set; }
        public int Count { get; set; }
    }
}
