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

        public EVRenter GetById(int id) => _context.EVRenters.Find(id);

        public IEnumerable<EVRenter> GetAll() => _context.EVRenters.ToList();

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
