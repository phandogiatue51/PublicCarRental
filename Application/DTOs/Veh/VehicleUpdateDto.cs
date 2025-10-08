using PublicCarRental.Infrastructure.Data.Models;
using System.ComponentModel.DataAnnotations;

namespace PublicCarRental.Application.DTOs.Veh
{
    public class VehicleUpdateDto
    {
        public string? LicensePlate { get; set; }

        [Range(0, 100)]
        public int? BatteryLevel { get; set; }

        public VehicleStatus? Status { get; set; }

        public decimal? PricePerHour { get; set; }

        public int? StationId { get; set; }

        public int? ModelId { get; set; }
    }
}
