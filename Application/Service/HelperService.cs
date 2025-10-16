using PublicCarRental.Application.Service;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Inv;

public class HelperService : IHelperService
{
    private readonly IContractRepository _contractRepo;
    private readonly IInvoiceRepository _invoiceRepo;

    public HelperService(IContractRepository contractRepo, IInvoiceRepository invoiceRepo)
    {
        _contractRepo = contractRepo;
        _invoiceRepo = invoiceRepo;
    }

    public RentalContract GetContractById(int contractId)
    {
        return _contractRepo.GetById(contractId);
    }

    public int AutoCancelOverdueInvoices()
    {
        var invoices = _invoiceRepo.GetAll();

        if (invoices == null || !invoices.Any())
            return 0;

        var overdueInvoices = invoices
            .Where(i => i.Status == InvoiceStatus.Pending && DateTime.UtcNow > i.IssuedAt.AddMinutes(30))
            .ToList();

        int cancelledCount = 0;

        foreach (var invoice in overdueInvoices)
        {
            invoice.Status = InvoiceStatus.Overdue;
            _invoiceRepo.Update(invoice);

            var contract = _contractRepo.GetById((int)invoice.ContractId);
            if (contract != null && contract.Status == RentalStatus.ToBeConfirmed)
            {
                contract.Status = RentalStatus.Cancelled;
                _contractRepo.Update(contract);
                cancelledCount++;
            }
        }

        return cancelledCount;
    }

}