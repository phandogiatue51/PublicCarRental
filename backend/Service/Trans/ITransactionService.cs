using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Trans
{
    public interface ITransactionService
    {
        public IEnumerable<TransactionDto> GetAll();
        public void CreateTransaction(RentalContract contract);
        public bool RefundContract(RentalContract contract);
    }
}
