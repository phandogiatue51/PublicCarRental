using PublicCarRental.DTOs;
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

        public EVRenter GetRenterById(int id) => _renterRepo.GetById(id);

        public IEnumerable<EVRenter> GetAllRenters() => _renterRepo.GetAll();

        public void UpdateRenter(EVRenter renter) => _renterRepo.Update(renter);

        public void DeleteRenter(int id) => _renterRepo.Delete(id);

        public void CreateRenter (int accountId, AccountRegistrationDto dto)
        {
            var renter = new EVRenter
            {
                AccountId = accountId,
                LicenseNumber = dto.LicenseNumber
            };

            _renterRepo.Create(renter);
        }
    }
}
