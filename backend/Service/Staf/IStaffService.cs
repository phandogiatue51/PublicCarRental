using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Staf
{
    public interface IStaffService
    {
        public Staff? GetStaffById(int id);
        public IEnumerable<Staff> GetAllStaff();
        public void CreateStaff(int accountId, StaffRegistrationDto dto);
        public bool UpdateStaff(int id, StaffRegistrationDto updatedStaff);
        public bool DeleteStaff(int id);
    }
}
