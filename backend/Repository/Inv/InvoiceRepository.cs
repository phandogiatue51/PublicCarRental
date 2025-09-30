using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;

namespace PublicCarRental.Repository.Inv
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private readonly EVRentalDbContext _context;

        public InvoiceRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public void Create(Invoice invoice)
        {
            _context.Invoices.Add(invoice);
            _context.SaveChanges();
        }
        public IQueryable<Invoice> GetAll()
        {
            return _context.Invoices
                .Include(i => i.Contract);
        }

        public Invoice GetById(int id)
        {
            return _context.Invoices
                .Include(i => i.Contract)
                .FirstOrDefault(i => i.InvoiceId == id);
        }

        public Invoice? GetByContractId(int contractId)
        {
            return _context.Invoices
                .Include(i => i.Contract)
                .FirstOrDefault(i => i.ContractId == contractId);
        }
       
        public void Update(Invoice invoice)
        {
            _context.Invoices.Update(invoice);
            _context.SaveChanges();
        }
    }
}
