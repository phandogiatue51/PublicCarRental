using PublicCarRental.Models;

namespace PublicCarRental.Repository.Staf
{
    public interface IStaffRepository
    {
        public Staff? GetById(int id);
        public IEnumerable<Staff> GetAll();
        void Create(Staff staff);
        void Update(Staff staff);
        public void ChangeStatus(int staffId);
    }
}
