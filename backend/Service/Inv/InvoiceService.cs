using PublicCarRental.Models;
using PublicCarRental.Repository.Inv;

namespace PublicCarRental.Service.Inv
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _repo;

        public InvoiceService(IInvoiceRepository repo)
        {
            _repo = repo;
        }

        public Invoice GetInvoiceById(int id)
        {
            return _repo.GetById(id);
        }

        public IEnumerable<Invoice> GetAllInvoices()
        {
            return _repo.GetAll();
        }

        public void CreateInvoice(int contractId, decimal amount)
        {
            var invoice = new Invoice
            {
                ContractId = contractId,
                IssuedAt = DateTime.UtcNow,
                AmountDue = amount,
                Status = InvoiceStatus.Unpaid
            };

            _repo.Create(invoice);
        }

        public bool UpdateInvoice(int id, Invoice updatedInvoice)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            existing.AmountDue = updatedInvoice.AmountDue;
            existing.AmountPaid = updatedInvoice.AmountPaid;
            existing.PaidAt = updatedInvoice.PaidAt;
            existing.Status = updatedInvoice.Status;
            existing.Notes = updatedInvoice.Notes;

            _repo.Update(existing);
            return true;
        }

        public bool IsInvoicePaid(int contractId)
        {
            var invoice = _repo.GetByContractId(contractId);
            return invoice != null && invoice.Status == InvoiceStatus.Paid;
        }
    }
}
