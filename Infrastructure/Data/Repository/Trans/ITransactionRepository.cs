using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Trans
{
    public interface ITransactionRepository
    {
        public IQueryable<Transaction> GetAll();
        public void Create(Transaction transaction);

    }
}
