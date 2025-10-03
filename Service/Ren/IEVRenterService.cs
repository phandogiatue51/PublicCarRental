using PublicCarRental.DTOs.Acc;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Ren
{
    public interface IEVRenterService
    {
        public IEnumerable<EVRenterDto> GetAll();
        public EVRenterDto? GetById(int id);
        public EVRenter? GetEntityById(int id);
        public (bool Success, string Message) CreateRenter(int accountId, AccountDto dto);
        public (bool Success, string Message) UpdateRenter(int id, EVRenterUpdateDto renter);
        public bool DeleteRenter(int id);
        public bool ChangeStatus(int renterId);
    }
}
