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

        public IQueryable<Vehicle> GetAll()
        {
            return _context.Vehicles
                .Include(v => v.Model)
                .Include(v => v.Station)
                .Include(v => v.RentalContracts);
        }

        public Vehicle GetById(int id)
        {
            return _context.Vehicles
                .Include(v => v.Model)
                .Include(v => v.Station)
                .Include(v => v.RentalContracts)
                .FirstOrDefault(v => v.VehicleId == id);
        }

        public Vehicle GetFirstAvailableVehicleByModel(int modelId, int stationId, DateTime requestedStart, DateTime requestedEnd)
        {
            var vehicles = _context.Vehicles
                .Include(v => v.RentalContracts)
                .Include(v => v.Model)
                .Where(v => v.ModelId == modelId && v.StationId == stationId)
                .ToList();

            foreach (var vehicle in vehicles)
            {
                bool isAvailable = true;

                foreach (var contract in vehicle.RentalContracts
                         .Where(c => c.Status == RentalStatus.Active || c.Status == RentalStatus.ToBeConfirmed))
                {
                    bool overlaps = requestedStart < contract.ChargingEndTime && requestedEnd > contract.StartTime;
                    if (overlaps)
                    {
                        isAvailable = false;
                        break;
                    }
                }

                if (isAvailable)
                    return vehicle;
            }

            return null;
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
