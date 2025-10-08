using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Infrastructure.Data.Repository.Inv
{
    public interface IInvoiceRepository
    {
        void Create(Invoice invoice);
        IQueryable<Invoice> GetAll();
        Invoice GetById(int id);
        public Invoice? GetByContractId(int contractId);
        void Update(Invoice invoice);
    }
}
