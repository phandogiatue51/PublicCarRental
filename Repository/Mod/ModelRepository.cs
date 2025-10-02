using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;

namespace PublicCarRental.Repository.Model
{
    public class ModelRepository : IModelRepository
    {
        private readonly EVRentalDbContext _context;

        public ModelRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public IQueryable<VehicleModel> GetAll()
        {
            return _context.VehicleModels
                .Include(m => m.Brand)
                .Include(m => m.Type)
                .Include(m => m.Vehicles);
        }

        public VehicleModel GetById(int id)
        {
            return _context.VehicleModels
                .Include(m => m.Brand)
                .Include(m => m.Type)
                .Include(m => m.Vehicles)
                .FirstOrDefault(m => m.ModelId == id);
        }

        public void Create(VehicleModel model)
        {
            _context.VehicleModels.Add(model);
            _context.SaveChanges();
        }

        public void Update(VehicleModel model)
        {
            _context.VehicleModels.Update(model);
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var model = _context.VehicleModels.Find(id);
            if (model != null)
            {
                _context.VehicleModels.Remove(model);
                _context.SaveChanges();
            }
        }
    }
}
