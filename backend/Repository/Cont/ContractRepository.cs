using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;

namespace PublicCarRental.Repository.Cont
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
        public IEnumerable<RentalContract> GetAll()
        {
            return _context.RentalContracts
                .Include(c => c.EVRenter)
                .Include(c => c.Vehicle)
                .Include(c => c.Station)
                .Include(c => c.Invoice)
                .ToList();
        }

        public void Update(RentalContract contract)
        {
            _context.RentalContracts.Update(contract);
            _context.SaveChanges();
        }
    }
}
