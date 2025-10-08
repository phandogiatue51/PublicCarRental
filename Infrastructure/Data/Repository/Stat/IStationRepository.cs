using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Stat
{
    public interface IStationRepository
    {
        IQueryable<Station> GetAll();
        Station GetById(int id);
        void Create(Station station);
        void Update(Station station);
        void Delete(int id);
    }
}
