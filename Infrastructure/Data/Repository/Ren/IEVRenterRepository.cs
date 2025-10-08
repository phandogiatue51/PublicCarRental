using PublicCarRental.Infrastructure.Data.Models;
using System.Linq.Expressions;

namespace PublicCarRental.Infrastructure.Data.Repository.Ren
{
    public interface IEVRenterRepository
    {
        EVRenter GetById(int id);
        IQueryable<EVRenter> GetAll();
        void Create(EVRenter renter);
        void Update(EVRenter renter);
        void Delete(int id);
        public void ChangeStatus(int renterId);
        public bool Exists(Expression<Func<EVRenter, bool>> predicate);
    }
}
