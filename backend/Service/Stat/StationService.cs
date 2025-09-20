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

        public IEnumerable<Station> GetAllStations()
        {
            return _repo.GetAll();
        }

        public Station GetStationById(int id)
        {
            return _repo.GetById(id);
        }

        public void CreateStation(Station station)
        {
            _repo.Create(station);
        }

        public bool UpdateStation(int id, Station updatedStation)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            existing.Name = updatedStation.Name;
            existing.Address = updatedStation.Address;
            existing.Latitude = updatedStation.Latitude;
            existing.Longitude = updatedStation.Longitude;

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
