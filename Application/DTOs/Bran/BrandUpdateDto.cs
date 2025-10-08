using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.Application.DTOs.Bran
{
    public class BrandUpdateDto
    {
        [Required]
        public string Name { get; set; }
    }
}
