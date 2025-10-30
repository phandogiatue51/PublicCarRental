using Microsoft.EntityFrameworkCore;
using PublicCarRental.Infrastructure.Data.Models;
using System;
using System.Linq.Expressions;

namespace PublicCarRental.Infrastructure.Data.Repository.Vehi
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
                    .ThenInclude(m => m.Brand)
                .Include(v => v.Model)
                    .ThenInclude(m => m.Type)
                .Include(v => v.Station)
                .Include(v => v.RentalContracts);
        }

        public Vehicle GetById(int id)
        {
            return _context.Vehicles
                .Include(v => v.Model)
                    .ThenInclude(m => m.Brand)
                .Include(v => v.Model)
                    .ThenInclude(m => m.Type)
                .Include(v => v.Station)
                .Include(v => v.RentalContracts)
                .FirstOrDefault(v => v.VehicleId == id);
        }

        public async Task<Vehicle?> GetFirstAvailableVehicleByModelAsync(int modelId, int stationId, DateTime startTime, DateTime endTime)
        {
            var availableStatuses = new[]
                {
                VehicleStatus.Available,
            };

            var availableVehicles = await _context.Vehicles
                .Include(v => v.Model)
                .Where(v => v.ModelId == modelId &&
                           v.StationId == stationId &&
                           availableStatuses.Contains(v.Status) &&
                           !v.RentalContracts.Any(c =>
                               (c.Status == RentalStatus.Confirmed ||
                                c.Status == RentalStatus.Active ||
                                c.Status == RentalStatus.ToBeConfirmed) &&
                               startTime < c.EndTime &&
                               endTime > c.StartTime))
                .OrderBy(x => Guid.NewGuid())
                .ToListAsync();

            return availableVehicles.FirstOrDefault();
        }

        public async Task<bool> CheckVehicleAvailabilityAsync(int vehicleId, DateTime startTime, DateTime endTime)
        {
            return await _context.Vehicles
                .Where(v => v.VehicleId == vehicleId)
                .SelectMany(v => v.RentalContracts)
                .Where(c => c.Status == RentalStatus.Confirmed ||
                           c.Status == RentalStatus.Active ||
                           c.Status == RentalStatus.ToBeConfirmed)
                .AllAsync(c => !(startTime < c.EndTime && endTime > c.StartTime));
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

        public bool Exists(Expression<Func<Vehicle, bool>> predicate)
        {
            return _context.Vehicles.Any(predicate);
        }
    }
}
