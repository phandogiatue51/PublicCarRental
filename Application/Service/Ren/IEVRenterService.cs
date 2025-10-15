using PublicCarRental.Application.DTOs.Acc;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Ren
{
    public interface IEVRenterService
    {
        public IEnumerable<EVRenterDto> GetAll();
        public IEnumerable<EVRenterDto> FilterByParam(string param);
        Task<EVRenterDto?> GetByIdAsync(int id);
        Task<EVRenter?> GetEntityByIdAsync(int id);
        Task<(bool Success, string Message)> CreateRenterAsync(int accountId, string license);
        Task<(bool Success, string Message)> UpdateRenterAsync(int id, EVRenterUpdateDto renter);
        Task<bool> DeleteRenterAsync(int id);
        public bool ChangeStatus(int renterId);
    }
}
