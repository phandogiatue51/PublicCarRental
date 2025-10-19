using PublicCarRental.Application.DTOs.Staf;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Staf
{
    public interface IStaffService
    {
        public IEnumerable<StaffReadDto> GetAllStaff();

        public Staff? GetEntityById(int id);
        public StaffReadDto? GetById(int id);
        public (bool Success, string Message) CreateStaff(int accountId, StaffDto dto);
        public bool UpdateStaff(int id, StaffUpdateDto updatedStaff);
        public bool DeleteStaff(int id);
        public bool ChangeStatus(int staffId);
        public IEnumerable<StaffReadDto> FilterByParamNStation(string param, int stationId);
    }
}
