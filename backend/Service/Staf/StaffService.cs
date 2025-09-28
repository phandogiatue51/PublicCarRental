using PublicCarRental.DTOs.Staf;
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

        public IEnumerable<StaffReadDto> GetAllStaff()
        {
            return _staffRepo.GetAll()
                .Where(s => s.Account != null)
                .Select(s => new StaffReadDto
                {
                    StaffId = s.StaffId,
                    FullName = s.Account.FullName,
                    Email = s.Account.Email,
                    PhoneNumber = s.Account.PhoneNumber,
                    IdentityCardNumber = s.Account.IdentityCardNumber,
                    StationId = s.StationId,
                    Status = s.Account.Status
                });
        }

        public StaffReadDto? GetById(int id)
        {
            var staff = _staffRepo.GetById(id);
            if (staff == null || staff.Account == null) return null;

            return new StaffReadDto
            {
                StaffId = staff.StaffId,
                FullName = staff.Account.FullName,
                Email = staff.Account.Email,
                PhoneNumber = staff.Account.PhoneNumber,
                IdentityCardNumber = staff.Account.IdentityCardNumber,
                StationId = staff.StationId,
                Status = staff.Account.Status
            };
        }

        public Staff? GetEntityById(int id)
        {
            return _staffRepo.GetById(id);
        }

        public bool UpdateStaff(int id, StaffUpdateDto updatedStaff)
        {
            var staff = _staffRepo.GetById(id);
            if (staff == null || staff.Account == null) return false;

            staff.Account.FullName = updatedStaff.FullName;
            staff.Account.Email = updatedStaff.Email;
            staff.Account.PhoneNumber = updatedStaff.PhoneNumber;
            staff.Account.IdentityCardNumber = updatedStaff.IdentityCardNumber;

            // Only update password if provided
            if (!string.IsNullOrEmpty(updatedStaff.Password))
            {
                // You would need to hash the password here
                // For now, we'll assume the AccountService has a method to update password
                // staff.Account.PasswordHash = HashPassword(updatedStaff.Password);
            }

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

        public void CreateStaff(int accountId, StaffDto dto)
        {
            var staff = new Staff
            {
                AccountId = accountId,
                StationId = dto.StationId,
            };

            _staffRepo.Create(staff);
        }

        public bool ChangeStatus(int staffId)
        {
            _staffRepo.ChangeStatus(staffId);
            return true;
        }
    }
}
