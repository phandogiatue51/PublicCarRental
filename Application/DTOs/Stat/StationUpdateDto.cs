using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.Application.DTOs.Stat
{
    public class StationUpdateDto
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public string Address { get; set; }
        [Required]
        public double Latitude { get; set; }
        [Required]
        public double Longitude { get; set; }
    }
}
