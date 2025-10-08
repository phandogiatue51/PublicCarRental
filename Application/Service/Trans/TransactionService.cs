using PublicCarRental.Application.DTOs;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Trans;
using Transaction = PublicCarRental.Infrastructure.Data.Models.Transaction;

namespace PublicCarRental.Application.Service.Trans
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IContractRepository _contractRepository;

        public TransactionService(ITransactionRepository transactionRepository, 
            IContractRepository contractRepository)
        {
            _transactionRepository = transactionRepository;
            _contractRepository = contractRepository;
        }

        public IEnumerable<TransactionDto> GetAll()
        {
            return _transactionRepository.GetAll()
                .Select(i => new TransactionDto
                {
                    TransactionId = i.TransactionId,
                    ContractId = i.ContractId,
                    Type = i.Type,
                    Amount = i.Amount,
                    Timestamp = i.Timestamp,
                    Note = i.Note,
                }).ToList(); 
        }

        public void CreateTransaction(int contractId)
        {
            var contract = _contractRepository.GetById(contractId);
            var transaction = new Transaction
            {
                ContractId = contract.ContractId,
                Type = TransactionType.Income,
                Amount = (decimal)contract.TotalCost,
                Timestamp = DateTime.UtcNow,
                Note = $"Transaction for contract #{contract.ContractId} created"
            };
            _transactionRepository.Create(transaction);
        }

        public bool RefundContract(RentalContract contract)
        {
            if (contract == null) return false;
            var refundTransaction = new Transaction
            {
                ContractId = contract.ContractId,
                Type = TransactionType.Refund,
                Amount = (decimal)contract.TotalCost,
                Timestamp = DateTime.UtcNow,
                Note = $"Refund issued for cancelled contract #{contract.ContractId}"
            };
            _transactionRepository.Create(refundTransaction);

            contract.Status = RentalStatus.Cancelled;
            _contractRepository.Update(contract);

            return true;
        }
    }
}
