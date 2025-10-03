using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;
using PublicCarRental.Repository.Inv;
using PublicCarRental.Service.Cont;

namespace PublicCarRental.Service.Inv
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _repo;
        private readonly IHelperService _contInvHelperService;
        private readonly IContractService _contractService;
        public InvoiceService(IInvoiceRepository repo, IHelperService contInvHelperService,
            IContractService contractService)
        {
            _repo = repo;
            _contInvHelperService = contInvHelperService;
            _contractService = contractService;
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
                }).ToList();
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

        public (bool Success, string Message) CreateInvoice(int contractId)
        {
            try
            {
                var contract = _contInvHelperService.GetContractById(contractId);
                if (contract == null) return (false, "Contract does not exist");
                var invoice = new Invoice
                {
                    ContractId = contract.ContractId,
                    IssuedAt = DateTime.UtcNow,
                    AmountDue = (decimal)contract.TotalCost
                };
                _repo.Create(invoice);
                return (true, $"Invoice {invoice.InvoiceId} created successfully!");
            }
            catch (Exception)
            {
                return (false, "You can only create one invoice per contract");
            }
        }

        public bool UpdateInvoice(Invoice invoice)
        {
            _repo.Update(invoice);
            return true;
        }

        public IEnumerable<InvoiceDto> GetInvoiceByRenterId(int renterId)
        {
            var invoices = _repo.GetAll()
                .Where(i => i.Contract.EVRenter.RenterId == renterId)
                .ToList();
            return invoices.Select(i => new InvoiceDto
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
        public Invoice GetInvoiceByOrderCode(int orderCode)
        {
            return _repo.GetAll().FirstOrDefault(i => i.OrderCode == orderCode);
        }

        public bool UpdateInvoiceStatus(int invoiceId, InvoiceStatus status, decimal amountPaid = 0)
        {
            try
            {
                var invoice = _repo.GetById(invoiceId);
                if (invoice == null) 
                {
                    return false;
                }
                
                invoice.Status = status;
                if (status == InvoiceStatus.Paid)
                {
                    invoice.PaidAt = DateTime.UtcNow;
                    invoice.AmountPaid = amountPaid > 0 ? amountPaid : invoice.AmountDue;
                    
                    var contractUpdateResult = _contractService.UpdateContractStatus(invoice.ContractId, RentalStatus.Confirmed);
                }
                else if (status == InvoiceStatus.Unpaid && invoice.Contract.Status != RentalStatus.Cancelled)
                {
                    var contractUpdateResult = _contractService.UpdateContractStatus(invoice.ContractId, RentalStatus.Cancelled);
                }
                
                _repo.Update(invoice);

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}
