using PublicCarRental.Models;

namespace PublicCarRental.Service.Stat
{
    public interface IStationService
    {
        IEnumerable<Station> GetAllStations();
        Station GetStationById(int id);
        void CreateStation(Station station);
        bool UpdateStation(int id, Station updatedStation);
        bool DeleteStation(int id);
    }
}
