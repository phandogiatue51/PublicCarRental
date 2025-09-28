using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;
using System.Linq;

namespace PublicCarRental.Repository.Staf
{
    public class StaffRepository : IStaffRepository
    {
        private readonly EVRentalDbContext _context;

        public StaffRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public void Create(Staff staff)
        {
            _context.Staffs.Add(staff);
            _context.SaveChanges();
        }

        public void Update(Staff staff)
        {
            _context.Staffs.Update(staff);
            _context.SaveChanges();
        }

        public IEnumerable<Staff> GetAll()
        {
            return _context.Staffs
                .Include(s => s.Account)
                .Include(s => s.Station)
                .ToList();
        }

        public Staff? GetById(int id)
        {
            return _context.Staffs
                .Include(s => s.Account)
                .Include(s => s.Station)
                .FirstOrDefault(s => s.StaffId == id);
        }

        public IEnumerable<Staff> GetByStationId(int stationId) => _context.Staffs.Where(s => s.StationId == stationId).ToList();

        public void ChangeStatus(int staffId)
        {
            var staff = _context.Staffs.Include(s => s.Account).FirstOrDefault(s => s.StaffId == staffId);
            if (staff == null) throw new Exception("Staff not found");
            if (staff.Account == null) throw new Exception("Account not found");
            staff.Account.Status = staff.Account.Status == AccountStatus.Active ? AccountStatus.Inactive : AccountStatus.Active;
            _context.SaveChanges();
        }
    }
}
