using PublicCarRental.Models;

namespace PublicCarRental.Repository.Inv
{
    public interface IInvoiceRepository
    {
        void Create(Invoice invoice);
        IEnumerable<Invoice> GetAll();
        Invoice GetById(int id);
        public Invoice? GetByContractId(int contractId);
        void Update(Invoice invoice);
    }
}
