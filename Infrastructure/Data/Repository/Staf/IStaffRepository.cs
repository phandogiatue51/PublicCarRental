using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Staf
{
    public interface IStaffRepository
    {
        public Staff? GetById(int id);
        public IQueryable<Staff> GetAll();
        void Create(Staff staff);
        void Update(Staff staff);
        public void ChangeStatus(int staffId);
    }
}
