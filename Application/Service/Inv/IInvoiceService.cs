using PublicCarRental.Application.DTOs.Inv;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Inv
{
    public interface IInvoiceService
    {
        public IEnumerable<InvoiceDto> GetAll();
        public InvoiceDto GetById(int id);
        public InvoiceDto GetByContractId(int contractId);
        public InvoiceDto GetByOrderCode(int orderCode);
        public Invoice GetEntityById(int id);
        public bool UpdateInvoice(Invoice invoice);
        public IEnumerable<InvoiceDto> GetInvoiceByRenterId(int renterId);
        public Invoice GetInvoiceByOrderCode(int orderCode);
        public bool UpdateInvoiceStatus(int invoiceId, InvoiceStatus status, decimal amountPaid = 0);
        public IEnumerable<InvoiceDto> GetInvoiceByStationId(int stationId);
        public bool DeleteInvoice(Invoice invoice);
        Task<Invoice> CreateAdditionalInvoiceAsync(int contractId, decimal amount, string note);
        Task<Invoice> GetOriginalInvoiceAsync(int contractId);
        Task<decimal> GetTotalPaidAmountAsync(int contractId);

        public IEnumerable<InvoiceDto> FilterInvoices(int? contractId = null, int? orderCode = null, int? stationId = null);

    }
}
