using PublicCarRental.Application.DTOs.Acc;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Ren
{
    public interface IEVRenterService
    {
        public IEnumerable<EVRenterDto> GetAll();
        public EVRenterDto? GetById(int id);
        public EVRenter? GetEntityById(int id);
        Task<(bool Success, string Message)> CreateRenterAsync(int accountId, AccountDto dto);
        public (bool Success, string Message) UpdateRenter(int id, EVRenterUpdateDto renter);
        public bool DeleteRenter(int id);
        public bool ChangeStatus(int renterId);
    }
}
