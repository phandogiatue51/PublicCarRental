using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PublicCarRental.Infrastructure.Data.Models
{
    public class VehicleModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ModelId { get; set; }
        public string Name { get; set; }
        public int BrandId { get; set; }
        public VehicleBrand Brand { get; set; }
        public int TypeId { get; set; }
        public VehicleType Type { get; set; }
        public ICollection<Vehicle> Vehicles { get; set; }
        public decimal PricePerHour { get; set; }
        public string? ImageUrl { get; set; }
        public ICollection<Favorite> FavoritedBy { get; set; }
    }
}
