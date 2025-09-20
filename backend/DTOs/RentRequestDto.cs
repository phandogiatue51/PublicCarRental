namespace PublicCarRental.DTOs
{
    public class RentRequestDto
    {
        public int EVRenterId { get; set; }
        public int VehicleId { get; set; }
        public int StationId { get; set; }
        public int RentalHours { get; set; }
    }
}

