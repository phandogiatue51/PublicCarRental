using PublicCarRental.Models;

namespace PublicCarRental.DTOs.Cont
{
    public class UpdateContractDto
    {
        public int ModelId { get; set; }
        public int StationId { get; set; }
        public int StaffId { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
    }
}
