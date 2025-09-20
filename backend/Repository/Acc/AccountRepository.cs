using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;

namespace PublicCarRental.Repository.Acc
{
    public class AccountRepository : IAccountRepository
    {
        private readonly EVRentalDbContext _context;

        public AccountRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public Account GetById(int id)
        {
            return _context.Accounts.Find(id);
        }

        public IEnumerable<Account> GetAll()
        {
            return _context.Accounts.ToList();
        }

        public void Create(Account account)
        {
            _context.Accounts.Add(account);
            _context.SaveChanges();
        }

        public void Update(Account account)
        {
            _context.Accounts.Update(account);
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var account = _context.Accounts.Find(id);
            if (account != null)
            {
                _context.Accounts.Remove(account);
                _context.SaveChanges();
            }
        }

        public Account? GetByIdentifier(string identifier)
        {
            return _context.Accounts.FirstOrDefault(a => a.Email == identifier || a.PhoneNumber == identifier);
        }
    }
}
