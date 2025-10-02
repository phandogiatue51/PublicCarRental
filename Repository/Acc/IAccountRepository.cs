using PublicCarRental.Models;

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
    }
}
