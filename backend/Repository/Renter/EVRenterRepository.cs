using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;

namespace PublicCarRental.Repository.Renter
{
    public class EVRenterRepository : IEVRenterRepository
    {
        private readonly EVRentalDbContext _context;

        public EVRenterRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public IEnumerable<EVRenter> GetAll()
        {
            return _context.EVRenters
                .Include(r => r.Account)
                .ToList();
        }

        public EVRenter? GetById(int id)
        {
            return _context.EVRenters
                .Include(r => r.Account)
                .FirstOrDefault(r => r.RenterId == id);
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
    }
}
