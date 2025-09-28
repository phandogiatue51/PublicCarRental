using PublicCarRental.DTOs.Acc;
using PublicCarRental.Models;
using PublicCarRental.Repository.Renter;

namespace PublicCarRental.Service.Renter
{
    public class EVRenterService : IEVRenterService
    {
        private readonly IEVRenterRepository _renterRepo;

        public EVRenterService(IEVRenterRepository renterRepo)
        {
            _renterRepo = renterRepo;
        }

        public IEnumerable<EVRenterDto> GetAll()
        {
            return _renterRepo.GetAll()
                .Where(r => r.Account != null)
                .Select(r => new EVRenterDto
                {
                    RenterId = r.RenterId,
                    FullName = r.Account.FullName,
                    Email = r.Account.Email,
                    PhoneNumber = r.Account.PhoneNumber,
                    IdentityCardNumber = r.Account.IdentityCardNumber,
                    LicenseNumber = r.LicenseNumber,
                    Status = r.Account.Status
                });
        }

        public EVRenterDto? GetById(int id)
        {
            var r = _renterRepo.GetById(id);
            if (r == null || r.Account == null) return null;

            return new EVRenterDto
            {
                RenterId = r.RenterId,
                FullName = r.Account.FullName,
                Email = r.Account.Email,
                PhoneNumber = r.Account.PhoneNumber,
                IdentityCardNumber = r.Account.IdentityCardNumber,
                LicenseNumber = r.LicenseNumber,
                Status = r.Account.Status
            };
        }

        public EVRenter? GetEntityById(int id) => _renterRepo.GetById(id);

        public bool UpdateRenter(int id, AccountDto renter)
        {
            var existingRenter = _renterRepo.GetById(id);
            if (existingRenter == null || existingRenter.Account == null) return false;
            existingRenter.Account.FullName = renter.FullName;
            existingRenter.Account.Email = renter.Email;
            existingRenter.Account.PhoneNumber = renter.PhoneNumber;
            existingRenter.Account.IdentityCardNumber = renter.IdentityCardNumber;
            existingRenter.LicenseNumber = renter.LicenseNumber;
            _renterRepo.Update(existingRenter);
            return true;
        }

        public bool DeleteRenter(int id)
        {
        
            var renter = _renterRepo.GetById(id);
            if (renter == null) return false;

            renter.Account.Status = AccountStatus.Inactive;
            _renterRepo.Update(renter);
            return true;
        }

        public void CreateRenter (int accountId, AccountDto dto)
        {
            var renter = new EVRenter
            {
                AccountId = accountId,
                LicenseNumber = dto.LicenseNumber
            };

            _renterRepo.Create(renter);
        }

        public bool ChangeStatus(int renterId)
        {
            _renterRepo.ChangeStatus(renterId);
            return true;
        }
    }
}
