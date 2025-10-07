using PublicCarRental.Models;
using PublicCarRental.Repository.Staf;

namespace PublicCarRental.Service.Staf
{
    public class StaffNotificationService
    {
        private readonly IStaffRepository _staffRepo;
        private readonly ILogger<StaffNotificationService> _logger;

        public StaffNotificationService(IStaffRepository staffRepo, ILogger<StaffNotificationService> logger)
        {
            _staffRepo = staffRepo;
            _logger = logger;
        }

        public async Task<List<Staff>> GetStaffToNotifyAsync(int stationId)
        {
            var staff = _staffRepo.GetAll()
                .Where(s => s.StationId == stationId &&
                           s.Account.Status == AccountStatus.Active)
                .ToList();

            return staff;
        }


    }
}
