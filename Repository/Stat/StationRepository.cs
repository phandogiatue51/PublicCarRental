using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;

namespace PublicCarRental.Repository.Stat
{
    public class StationRepository : IStationRepository
    {
        private readonly EVRentalDbContext _context;

        public StationRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public IQueryable<Station> GetAll()
        {
            return _context.Stations
                .Include(s => s.Vehicles)
                .Include(s => s.StaffMembers)
                .Include(s => s.RentalContracts);
        }

        public Station GetById(int id)
        {
            return _context.Stations
                .Include(s => s.Vehicles)
                .Include(s => s.StaffMembers)
                .Include(s => s.RentalContracts)
                .FirstOrDefault(s => s.StationId == id);
        }

        public void Create(Station station)
        {
            _context.Stations.Add(station);
            _context.SaveChanges();
        }

        public void Update(Station station)
        {
            _context.Stations.Update(station);
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var station = _context.Stations.Find(id);
            if (station != null)
            {
                _context.Stations.Remove(station);
                _context.SaveChanges();
            }
        }
    }
}
