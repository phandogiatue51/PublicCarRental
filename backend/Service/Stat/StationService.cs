using PublicCarRental.DTOs.Stat;
using PublicCarRental.Models;
using PublicCarRental.Repository.Stat;

namespace PublicCarRental.Service.Stat
{
    public class StationService : IStationService
    {
        private readonly IStationRepository _repo;

        public StationService(IStationRepository repo)
        {
            _repo = repo;
        }
        public IEnumerable<StationDto> GetAll()
        {
            return _repo.GetAll()
                .Select(s => new StationDto
                {
                    StationId = s.StationId,
                    Name = s.Name,
                    Address = s.Address,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,

                    VehicleCount = s.Vehicles?.Count ?? 0,
                    StaffCount = s.StaffMembers?.Count ?? 0
                });
        }

        public StationDto? GetById(int id)
        {
            var s = _repo.GetById(id);
            if (s == null) return null;

            return new StationDto
            {
                StationId = s.StationId,
                Name = s.Name,
                Address = s.Address,
                Latitude = s.Latitude,
                Longitude = s.Longitude,

                VehicleCount = s.Vehicles?.Count ?? 0,
                StaffCount = s.StaffMembers?.Count ?? 0
            };
        }

        public Station GetEntityById(int id)
        {
            return _repo.GetById(id);
        }

        public int CreateStation(StationUpdateDto dto)
        {
            var station = new Station
            {
                Name = dto.Name,
                Address = dto.Address,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude
            };
            _repo.Create(station);
            return station.StationId;
        }

        public bool UpdateStation(int id, StationUpdateDto station)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;
            existing.Name = station.Name;
            existing.Address = station.Address;
            existing.Latitude = station.Latitude;
            existing.Longitude = station.Longitude;
            _repo.Update(existing);
            return true;
        }

        public bool DeleteStation(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            _repo.Delete(id);
            return true;
        }
    }
}
