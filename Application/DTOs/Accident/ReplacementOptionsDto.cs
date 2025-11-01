using PublicCarRental.Application.DTOs.Veh;

namespace PublicCarRental.Application.DTOs.Accident
{
    public class ReplacementOptionsDto
    {
        public int ContractId { get; set; }
        public List<VehicleOptionDto> AvailableVehicles { get; set; }
        public VehicleDto CurrentVehicle { get; set; }
        public string Message { get; set; }
    }
}
