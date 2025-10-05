using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Inv
{
    public interface IInvoiceService
    {
        public IEnumerable<InvoiceDto> GetAll();
        public InvoiceDto GetById(int id);
        public Invoice GetEntityById(int id);
        public (bool Success, string Message) CreateInvoice(int contractId);
        public bool UpdateInvoice(Invoice invoice);
        public IEnumerable<InvoiceDto> GetInvoiceByRenterId(int renterId);
        public Invoice GetInvoiceByOrderCode(int orderCode);
        public bool UpdateInvoiceStatus(int invoiceId, InvoiceStatus status, decimal amountPaid = 0);
        public IEnumerable<InvoiceDto> GetInvoiceByStationId(int stationId);
    }
}
