using PublicCarRental.DTOs;
using PublicCarRental.Models;
using PublicCarRental.Repository.Staf;

namespace PublicCarRental.Service.Staf
{
    public class StaffService : IStaffService
    {
        private readonly IStaffRepository _staffRepo;

        public StaffService(IStaffRepository staffRepo)
        {
            _staffRepo = staffRepo;
        }

        public IEnumerable<Staff> GetAllStaff()
        {
            return _staffRepo.GetAll();
        }

        public Staff? GetStaffById(int id)
        {
            return _staffRepo.GetById(id);
        }

        public bool UpdateStaff(int id, StaffRegistrationDto updatedStaff)
        {
            var staff = _staffRepo.GetById(id);
            if (staff == null) return false;

            staff.StationId = updatedStaff.StationId;
            _staffRepo.Update(staff);
            return true;
        }

        public bool DeleteStaff(int id)
        {
            var staff = _staffRepo.GetById(id);
            if (staff == null) return false;

            staff.Account.Status = AccountStatus.Inactive;
            _staffRepo.Update(staff);
            return true;
        }
        public void CreateStaff(int accountId, StaffRegistrationDto dto)
        {
            var staff = new Staff
            {
                AccountId = accountId,
                StationId = dto.StationId,
            };

            _staffRepo.Create(staff);
        }
    }
}
