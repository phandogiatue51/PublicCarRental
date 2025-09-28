using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;
using PublicCarRental.Repository.Inv;
using PublicCarRental.Service.Cont;

namespace PublicCarRental.Service.Inv
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _repo;
        private readonly IContInvHelperService _contInvHelperService;
        public InvoiceService(IInvoiceRepository repo, IContInvHelperService contInvHelperService)
        {
            _repo = repo;
            _contInvHelperService = contInvHelperService;
        }

        public IEnumerable<InvoiceDto> GetAll()
        {
            return _repo.GetAll()
                .Select(i => new InvoiceDto
                {
                    InvoiceId = i.InvoiceId,
                    ContractId = i.ContractId,
                    IssuedAt = i.IssuedAt,
                    AmountDue = i.AmountDue,
                    AmountPaid = i.AmountPaid,
                    PaidAt = i.PaidAt,
                    Status = i.Status,
                });
        }

        public InvoiceDto GetById(int id)
        {
            var i = _repo.GetById(id);
            if (i == null) return null;
            return new InvoiceDto
            {
                InvoiceId = i.InvoiceId,
                ContractId = i.ContractId,
                IssuedAt = i.IssuedAt,
                AmountDue = i.AmountDue,
                AmountPaid = i.AmountPaid,
                PaidAt = i.PaidAt,
                Status = i.Status,
            };
        }

        public Invoice GetEntityById(int id)
        {
            return _repo.GetById(id);
        }

        public void CreateInvoice(InvoiceCreateDto dto)
        {
            var contract = _contInvHelperService.GetContractById(dto.ContractId);
            var invoice = new Invoice
            {
                ContractId = contract.ContractId,
                IssuedAt = DateTime.UtcNow,
                AmountDue = (decimal)contract.TotalCost
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

            _repo.Update(existing);
            return true;
        }
    }
}
