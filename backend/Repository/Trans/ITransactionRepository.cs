using PublicCarRental.Models;

namespace PublicCarRental.Repository.Trans
{
    public interface ITransactionRepository
    {
        public IQueryable<Transaction> GetAll();
        public void Create(Transaction transaction);

    }
}
