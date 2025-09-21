using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;

namespace PublicCarRental.Repository.Vehi
{
    public class VehicleRepository : IVehicleRepository
    {
        private readonly EVRentalDbContext _context;

        public VehicleRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Vehicle> GetAll()
        {
            return _context.Vehicles
                .Include(v => v.Model)
                .Include(v => v.Station)
                .Include(v => v.RentalContracts)
                .ToList();
        }

        public Vehicle GetById(int id)
        {
            return _context.Vehicles
                .Include(v => v.Model)
                .Include(v => v.Station)
                .Include(v => v.RentalContracts)
                .FirstOrDefault(v => v.VehicleId == id);
        }

        public Vehicle GetFirstAvailableVehicleByModel(int modelId)
        {
            return _context.Vehicles
                .Where(v => v.ModelId == modelId && v.Status == VehicleStatus.Available)
                .OrderBy(v => v.VehicleId)
                .FirstOrDefault();
        }

        public void Create(Vehicle vehicle)
        {
            _context.Vehicles.Add(vehicle);
            _context.SaveChanges();
        }

        public void Update(Vehicle vehicle)
        {
            _context.Vehicles.Update(vehicle);
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var vehicle = _context.Vehicles.Find(id);
            if (vehicle != null)
            {
                _context.Vehicles.Remove(vehicle);
                _context.SaveChanges();
            }
        }
    }
}
