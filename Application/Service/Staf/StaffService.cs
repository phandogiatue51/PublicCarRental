using PublicCarRental.Application.DTOs.Staf;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Staf;
using PublicCarRental.Infrastructure.Data.Repository.Stat;
using PublicCarRental.Infrastructure.Helpers;

namespace PublicCarRental.Application.Service.Staf
{
    public class StaffService : IStaffService
    {
        private readonly IStaffRepository _staffRepo;
        private readonly PasswordHelper _passwordHelper;
        private readonly IStationRepository _stationRepository;

        public StaffService(IStaffRepository staffRepo, PasswordHelper passwordHelper, IStationRepository stationRepository)
        {
            _staffRepo = staffRepo;
            _passwordHelper = passwordHelper;
            _stationRepository = stationRepository;
        }

        public IEnumerable<StaffReadDto> GetAllStaff()
        {
            var stations = _stationRepository.GetAll().ToDictionary(s => s.StationId, s => s.Name);

            return _staffRepo.GetAll()
                .Where(s => s.Account != null)
                .Select(s => new StaffReadDto
                {
                    StaffId = s.StaffId,
                    AccountId = s.AccountId,
                    FullName = s.Account.FullName,
                    Email = s.Account.Email,
                    PhoneNumber = s.Account.PhoneNumber,
                    StationId = s.StationId,
                    StationName = s.StationId.HasValue && stations.ContainsKey(s.StationId.Value)
                                 ? stations[s.StationId.Value]
                                 : "No Station",
                    Status = s.Account.Status,
                    IdentityCardNumber = s.Account.IdentityCardNumber
                }).ToList();
        }

        public StaffReadDto? GetById(int id)
        {
            var staff = _staffRepo.GetById(id);
            if (staff == null || staff.Account == null) return null;

            return new StaffReadDto
            {
                StaffId = staff.StaffId,
                AccountId = staff.AccountId,
                FullName = staff.Account.FullName,
                Email = staff.Account.Email,
                PhoneNumber = staff.Account.PhoneNumber,
                StationId = staff.StationId,
                StationName = staff.Station.Name,
                Status = staff.Account.Status,
                IdentityCardNumber = staff.Account.IdentityCardNumber
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

            if (!string.IsNullOrEmpty(updatedStaff.Password))
            {
                staff.Account.PasswordHash = _passwordHelper.HashPassword(updatedStaff.Password);

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

        public (bool Success, string Message) CreateStaff(int accountId, StaffDto dto)
        {
            try
            {
                var staff = new Staff
                {
                    AccountId = accountId,
                    StationId = dto.StationId,
                };

                _staffRepo.Create(staff);
                return (true, "Staff created successfully.");
            }
            catch (Exception ex)
            {
                return (false, "An error occurred while creating the account.");
            }
        }

        public bool ChangeStatus(int staffId)
        {
            _staffRepo.ChangeStatus(staffId);
            return true;
        }

        public IEnumerable<StaffReadDto> FilterByParam(string? param, int? stationId, AccountStatus? status)
        {
            var query = _staffRepo.GetAll().Where(s => s.Account != null);

            if (stationId.HasValue)
            {
                query = query.Where(s => s.StationId == stationId.Value);
            }

            if (!string.IsNullOrWhiteSpace(param))
            {
                var p = param.Trim().ToLower();
                query = query.Where(s =>
                    (!string.IsNullOrEmpty(s.Account.FullName) && s.Account.FullName.ToLower().Contains(p)) ||
                    (!string.IsNullOrEmpty(s.Account.Email) && s.Account.Email.ToLower().Contains(p)) ||
                    (!string.IsNullOrEmpty(s.Account.PhoneNumber) && s.Account.PhoneNumber.ToLower().Contains(p))
                );
            }

            if (status.HasValue)
            {
                query = query.Where(r => r.Account.Status == status.Value);
            }

            return query.Select(s => new StaffReadDto
            {
                StaffId = s.StaffId,
                AccountId = s.AccountId,
                FullName = s.Account.FullName,
                Email = s.Account.Email,
                PhoneNumber = s.Account.PhoneNumber,
                StationId = s.StationId,
                StationName = s.Station.Name,
                Status = s.Account.Status,
                IdentityCardNumber = s.Account.IdentityCardNumber
            }).ToList();
        }
    }
}
