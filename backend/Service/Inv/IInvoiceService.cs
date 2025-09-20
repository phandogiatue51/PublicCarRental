using PublicCarRental.Models;

namespace PublicCarRental.Service.Inv
{
    public interface IInvoiceService
    {
        public void CreateInvoice(int contractId, decimal amount);
        bool UpdateInvoice(int id, Invoice updatedInvoice);
        IEnumerable<Invoice> GetAllInvoices();
        public Invoice GetInvoiceById(int id);
        public bool IsInvoicePaid(int contractId);
    }
}
