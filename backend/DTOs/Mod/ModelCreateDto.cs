using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.DTOs.Mod
{
    public class ModelCreateDto
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public int BrandId { get; set; }
        [Required]
        public int TypeId { get; set; }
    }
}
