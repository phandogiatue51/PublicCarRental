using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.DTOs.Bran
{
    public class BrandUpdateDto
    {
        [Required]
        public string Name { get; set; }
    }
}
