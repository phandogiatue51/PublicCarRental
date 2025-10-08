using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public class Favorite
    {
        [Key]
        public int FavoriteId { get; set; }

        public int AccountId { get; set; }
        public Account Account { get; set; }

        public int ModelId { get; set; }
        public VehicleModel VehicleModel { get; set; }

        public DateTime FavoritedAt { get; set; } = DateTime.UtcNow;
    }
}
