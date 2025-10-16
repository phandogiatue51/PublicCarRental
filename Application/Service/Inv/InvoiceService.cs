using PublicCarRental.Application.DTOs.Inv;
using PublicCarRental.Application.Service;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Trans;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Inv;

namespace PublicCarRental.Application.Service.Inv
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IInvoiceRepository _repo;
        private readonly IHelperService _contInvHelperService;
        private readonly IContractService _contractService;
        private readonly ITransactionService _transactionService;

        public InvoiceService(IInvoiceRepository repo, IHelperService contInvHelperService,
            IContractService contractService, ITransactionService transactionService)
        {
            _repo = repo;
            _contInvHelperService = contInvHelperService;
            _contractService = contractService;
            _transactionService = transactionService;
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

        public InvoiceDto GetByOrderCode(int orderCode)
        {
            var i = _repo.GetAll().FirstOrDefault(x => x.OrderCode == orderCode);
            if (i == null) return null;
            return new InvoiceDto
            {
                InvoiceId = i.InvoiceId,
                ContractId = i.ContractId,
                IssuedAt = i.IssuedAt,
                AmountDue = i.AmountDue,
                AmountPaid = i.AmountPaid,
                PaidAt = i.PaidAt,
                OrderCode = i.OrderCode,
                Status = i.Status,
            };
        }

        public InvoiceDto GetByContractId(int contractId)
        {
            var i = _repo.GetAll().FirstOrDefault(x => x.ContractId == contractId);
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
                    
                    var contractUpdateResult = _contractService.UpdateContractStatus((int)invoice.ContractId, RentalStatus.Confirmed);
                    _transactionService.CreateTransaction((int)invoice.ContractId);                   
                    
                }
                else if (status == InvoiceStatus.Cancelled && invoice.Contract.Status != RentalStatus.Cancelled)
                {
                    var contractUpdateResult = _contractService.UpdateContractStatus((int)invoice.ContractId, RentalStatus.Cancelled);
                }
                
                _repo.Update(invoice);

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public IEnumerable<InvoiceDto> GetInvoiceByStationId(int stationId)
        {
            var invoices = _repo.GetAll()
                .Where(i => i.Contract.Vehicle.StationId == stationId)
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
    }
}
