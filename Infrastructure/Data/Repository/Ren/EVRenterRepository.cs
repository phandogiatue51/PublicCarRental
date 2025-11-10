using Microsoft.EntityFrameworkCore;
using PublicCarRental.Infrastructure.Data.Models;
using System;
using System.Linq.Expressions;

namespace PublicCarRental.Infrastructure.Data.Repository.Ren
{
    public class EVRenterRepository : IEVRenterRepository
    {
        private readonly EVRentalDbContext _context;

        public EVRenterRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public IQueryable<EVRenter> GetAll()
        {
            return _context.EVRenters
                .Include(r => r.Account);
        }
        public async Task<EVRenter?> GetByIdAsync(int id)
        {
            return await _context.EVRenters
                .Include(r => r.Account)
                .FirstOrDefaultAsync(r => r.RenterId == id); 
        }

        public void Create(EVRenter renter)
        {
            _context.EVRenters.Add(renter);
            _context.SaveChanges();
        }

        public void Update(EVRenter renter)
        {
            _context.EVRenters.Update(renter);
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var renter = _context.EVRenters.Find(id);
            if (renter != null)
            {
                _context.EVRenters.Remove(renter);
                _context.SaveChanges();
            }
        }

        public void ChangeStatus(int renterId)
        {
            var renter = _context.EVRenters.Include(r => r.Account).FirstOrDefault(r => r.RenterId == renterId);
            if (renter == null) throw new Exception("Renter not found");
            if (renter.Account == null) throw new Exception("Account not found");

            renter.Account.Status = renter.Account.Status == AccountStatus.Active
                ? AccountStatus.Suspended
                : AccountStatus.Active;

            _context.SaveChanges();
        }

        public bool Exists(Expression<Func<EVRenter, bool>> predicate)
        {
            return _context.EVRenters.Any(predicate);
        }
    }
}
