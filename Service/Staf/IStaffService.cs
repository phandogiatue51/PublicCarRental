using PublicCarRental.DTOs.Staf;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Staf
{
    public interface IStaffService
    {
        public IEnumerable<StaffReadDto> GetAllStaff();

        public Staff? GetEntityById(int id);
        public StaffReadDto? GetById(int id);
        public (bool Success, string Message) CreateStaff(int accountId, StaffDto dto);
        public bool UpdateStaff(int id, StaffUpdateDto updatedStaff);
        public bool DeleteStaff(int id);
        public bool ChangeStatus(int staffId);
    }
}
