using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;

namespace PublicCarRental.Repository.Bran
{
    public class BrandRepository : IBrandRepository
    {
        private readonly EVRentalDbContext _context;

        public BrandRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public IQueryable<VehicleBrand> GetAll()
        {
            return _context.VehicleBrands.Include(b => b.Models);
        }

        public VehicleBrand GetById(int id)
        {
            return _context.VehicleBrands.Include(b => b.Models).FirstOrDefault(b => b.BrandId == id);
        }

        public void Create(VehicleBrand brand)
        {
            _context.VehicleBrands.Add(brand);
            _context.SaveChanges();
        }

        public void Update(VehicleBrand brand)
        {
            _context.VehicleBrands.Update(brand);
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var brand = _context.VehicleBrands.Find(id);
            if (brand != null)
            {
                _context.VehicleBrands.Remove(brand);
                _context.SaveChanges();
            }
        }
    }
}
