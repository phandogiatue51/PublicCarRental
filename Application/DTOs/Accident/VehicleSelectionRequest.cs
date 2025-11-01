namespace PublicCarRental.Application.DTOs.Accident
{
    public class VehicleSelectionRequest
    {
        public int SelectedVehicleId { get; set; }
        public int StaffId { get; set; }
        public string Reason { get; set; }
    }
}
