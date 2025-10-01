using PublicCarRental.DTOs;
using PublicCarRental.Models;
using PublicCarRental.Repository.Trans;
using Transaction = PublicCarRental.Models.Transaction;

namespace PublicCarRental.Service.Trans
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IHelperService _contInvHelperService;

        public TransactionService(ITransactionRepository transactionRepository, IHelperService helperService)
        {
            _transactionRepository = transactionRepository;
            _contInvHelperService = helperService;
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

        public void CreateTransaction(RentalContract contract)
        {
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
            return true;
        }
    }
}
