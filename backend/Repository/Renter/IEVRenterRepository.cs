using PublicCarRental.Models;

namespace PublicCarRental.Repository.Renter
{
    public interface IEVRenterRepository
    {
        EVRenter GetById(int id);
        IEnumerable<EVRenter> GetAll();
        void Create(EVRenter renter);
        void Update(EVRenter renter);
        void Delete(int id);
        public void ChangeStatus(int renterId);
    }
}
