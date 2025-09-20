using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Renter
{
    public interface IEVRenterService
    {
        EVRenter GetRenterById(int id);
        IEnumerable<EVRenter> GetAllRenters();
        public void CreateRenter(int accountId, AccountRegistrationDto dto);
        void UpdateRenter(EVRenter renter);
        void DeleteRenter(int id);
    }
}
