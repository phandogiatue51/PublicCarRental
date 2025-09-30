using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

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

        [Required]
        public decimal PricePerHour { get; set; }

        public IFormFile? imageFile { get; set; }
    }
}
