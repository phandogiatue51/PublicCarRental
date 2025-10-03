using PublicCarRental.Models;
using System.Linq.Expressions;

namespace PublicCarRental.Repository.Acc
{
    public interface IAccountRepository
    {
        Account GetById(int id);
        IQueryable<Account> GetAll();
        void Create(Account account);
        void Update(Account account);
        void Delete(int id);
        public Account? GetByIdentifier(string identifier);
        public bool Exists(Expression<Func<Account, bool>> predicate);
        public int? GetRenterId(int accountId);
        public int? GetStaffId(int accountId);
        public int? GetStaffStationId(int accountId);

    }
}
