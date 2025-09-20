using PublicCarRental.DTOs.Stat;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Stat
{
    public interface IStationService
    {
        public IEnumerable<StationDto> GetAll();
        public StationDto? GetById(int id);
        Station GetEntityById(int id);
        public int CreateStation(StationUpdateDto dto);
        public bool UpdateStation(int id, StationUpdateDto station);
        bool DeleteStation(int id);
    }
}
