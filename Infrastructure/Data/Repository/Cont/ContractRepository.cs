using Microsoft.EntityFrameworkCore;
using PublicCarRental.Infrastructure.Data.Models;
using System;

namespace PublicCarRental.Infrastructure.Data.Repository.Cont
{
    public class ContractRepository : IContractRepository
    {
        private readonly EVRentalDbContext _context;

        public ContractRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public void Create(RentalContract contract)
        {
            _context.RentalContracts.Add(contract);
            _context.SaveChanges();
        }

        public RentalContract GetById(int id)
        {
            return _context.RentalContracts
                .Include(c => c.EVRenter)
                            .ThenInclude(r => r.Account)
                .Include(c => c.Staff)
                            .ThenInclude(r => r.Account)
                .Include(c => c.Vehicle)
                .Include(c => c.Station)
                .Include(c => c.Invoice)
                .FirstOrDefault(c => c.ContractId == id);
        }

        public IQueryable<RentalContract> GetAll()
        {
            return _context.RentalContracts
                .Include(c => c.Invoice)
                .Include(c => c.EVRenter)
                    .ThenInclude(r => r.Account)
                .Include(c => c.Staff)
                    .ThenInclude(s => s.Account)
                .Include(c => c.Vehicle)
                .Include(c => c.Station);
        }

        public void Update(RentalContract contract)
        {
            _context.RentalContracts.Update(contract);
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var contract = _context.RentalContracts.Find(id);
            if (contract != null)
            {
                _context.RentalContracts.Remove(contract);
                _context.SaveChanges();
            }
        }

    }
}
