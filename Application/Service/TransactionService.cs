using PublicCarRental.Application.DTOs;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Inv;
using PublicCarRental.Infrastructure.Data.Repository.Trans;
using Transaction = PublicCarRental.Infrastructure.Data.Models.Transaction;

namespace PublicCarRental.Application.Service
{
    public class TransactionService : ITransactionService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IInvoiceRepository _invoiceRepository;

        public TransactionService(ITransactionRepository transactionRepository, IInvoiceRepository invoiceRepository) 
        {
            _transactionRepository = transactionRepository;
            _invoiceRepository = invoiceRepository;
        }

        public IEnumerable<TransactionDto> GetAll()
        {
            return _transactionRepository.GetAll()
                .Select(i => new TransactionDto
                {
                    TransactionId = i.TransactionId,
                    InvoiceId = i.InvoiceId,
                    Type = i.Type,
                    Amount = i.Amount,
                    Timestamp = i.Timestamp,
                    Note = i.Note,
                }).ToList(); 
        }

        public void CreateTransaction(int invoiceId, TransactionType type, string note)
        {
            var invoice = _invoiceRepository.GetById(invoiceId);
            var transaction = new Transaction
            {
                
                Type = type,
                InvoiceId = invoice.InvoiceId,
                Amount = (decimal)invoice.AmountPaid,
                Timestamp = DateTime.UtcNow,
            };
            _transactionRepository.Create(transaction);
        }
    }
    public interface ITransactionService
    {
        public IEnumerable<TransactionDto> GetAll();
        public void CreateTransaction(int invoiceId, TransactionType type, string note);
    }
}
