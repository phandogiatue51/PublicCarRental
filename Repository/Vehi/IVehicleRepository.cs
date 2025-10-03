using PublicCarRental.Models;
using System.Linq.Expressions;

namespace PublicCarRental.Repository.Vehi
{
    public interface IVehicleRepository
    {
        IQueryable<Vehicle> GetAll();
        Vehicle GetById(int id);
        public Vehicle GetFirstAvailableVehicleByModel(int modelId, int stationId, DateTime requestedStart, DateTime requestedEnd);
        void Create(Vehicle vehicle);
        void Update(Vehicle vehicle);
        void Delete(int id);
        public bool Exists(Expression<Func<Vehicle, bool>> predicate);
    }
}
