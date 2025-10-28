using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.DTOs.Cont
{
    public class ContractDto
    {
        public int ContractId { get; set; }

        public int EVRenterId { get; set; }
        public string EVRenterName { get; set; }
        public int InvoiceCount { get; set; } = 0;

        public int? StaffId { get; set; }
        public string? StaffName { get; set; }

        public int VehicleId { get; set; }
        public string VehicleLicensePlate { get; set; }

        public int StationId { get; set; }
        public string StationName { get; set; } 

        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }

        public decimal? TotalCost { get; set; }
        public RentalStatus Status { get; set; }
        public string? Notes { get; set; }
        public string? ImageIn { get; set; }
        public string? ImageOut { get; set; }
        public bool? IsRated { get; set; }
    }
}
