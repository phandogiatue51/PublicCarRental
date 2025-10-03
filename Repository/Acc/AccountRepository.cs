using Microsoft.EntityFrameworkCore;
using PublicCarRental.Models;
using System;
using System.Linq.Expressions;

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

        public IQueryable<Account> GetAll()
        {
            return _context.Accounts;
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

        public bool Exists(Expression<Func<Account, bool>> predicate)
        {
            return _context.Accounts.Any(predicate);
        }
        public int? GetRenterId(int accountId)
        {
            return _context.EVRenters
                .Where(r => r.AccountId == accountId)
                .Select(r => (int?)r.RenterId)
                .FirstOrDefault();
        }

        public int? GetStaffId(int accountId)
        {
            return _context.Staffs
                .Where(s => s.AccountId == accountId)
                .Select(s => (int?)s.StaffId)
                .FirstOrDefault();
        }

        public int? GetStaffStationId(int accountId)
        {
            return _context.Staffs
                .Where(s => s.AccountId == accountId)
                .Select(s => s.StationId)
                .FirstOrDefault();
        }
    }
}
