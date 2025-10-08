using PublicCarRental.Application.DTOs;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Trans
{
    public interface ITransactionService
    {
        public IEnumerable<TransactionDto> GetAll();
        public void CreateTransaction(int contractId);
        public bool RefundContract(RentalContract contract);
    }
}
