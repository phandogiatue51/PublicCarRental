using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Inv
{
    public interface IInvoiceService
    {
        public IEnumerable<InvoiceDto> GetAll();
        public InvoiceDto GetById(int id);
        public Invoice GetEntityById(int id);
        public void CreateInvoice(InvoiceCreateDto dto);
        public bool UpdateInvoice(int id, Invoice updatedInvoice);
    }
}
