namespace PublicCarRental.Application.DTOs.Cont
{
    public class CreateContractDto
    {
        public int EVRenterId { get; set; }
        public int ModelId { get; set; }
        public int StationId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}

