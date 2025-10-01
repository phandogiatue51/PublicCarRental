using System.Linq;
using PublicCarRental.Models;

namespace PublicCarRental.Repository.Trans
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly EVRentalDbContext _context;

        public TransactionRepository(EVRentalDbContext context)
        {
            _context = context;
        }

        public IQueryable<Transaction> GetAll()
        {
            return _context.Transactions;
        }

        public void Create(Transaction transaction)
        {
            _context.Transactions.Add(transaction);
            _context.SaveChanges();
        }
    }
}
