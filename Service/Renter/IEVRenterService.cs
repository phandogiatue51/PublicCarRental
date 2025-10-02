using PublicCarRental.DTOs.Acc;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Renter
{
    public interface IEVRenterService
    {
        public IEnumerable<EVRenterDto> GetAll();
        public EVRenterDto? GetById(int id);
        public EVRenter? GetEntityById(int id);

        public void CreateRenter(int accountId, AccountDto dto);
        public bool UpdateRenter(int id, EVRenterUpdateDto renter);
        public bool DeleteRenter(int id);
        public bool ChangeStatus(int renterId);
    }
}
