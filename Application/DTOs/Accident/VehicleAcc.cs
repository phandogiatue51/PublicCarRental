using PublicCarRental.Infrastructure.Data.Models;
using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.Application.DTOs.Accident
{
    public class VehicleAcc
    {
        [Required]
        public int VehicleId { get; set; }
        [Required]
        public int? StaffId { get; set; }
        public string? Description { get; set; }
        [Required]
        public IFormFile? ImageUrl { get; set; } = null;
    }
}
