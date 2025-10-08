using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.Application.DTOs.Veh
{
    public class VehicleCreateDto
    {
        [Required]
        public string LicensePlate { get; set; }

        [Range(0, 100)]
        public int BatteryLevel { get; set; }

        public int? StationId { get; set; }

        [Required]
        public int ModelId { get; set; }
    }
}
