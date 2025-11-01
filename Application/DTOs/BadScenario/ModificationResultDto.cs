using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.DTOs.Veh;

namespace PublicCarRental.Application.DTOs.BadScenario
{
    public class ModificationResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public decimal PriceDifference { get; set; }
        public int? NewInvoiceId { get; set; }
        public int? RefundId { get; set; }
        public ContractDto UpdatedContract { get; set; }

        public List<VehicleOptionDto?> AvailableVehicles { get; set; } = new();
        public bool? RequiresUserSelection { get; set; }
    }
}