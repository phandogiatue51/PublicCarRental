using PublicCarRental.Models;
using PublicCarRental.Repository.Cont;
using PublicCarRental.Repository.Inv;
using PublicCarRental.Service;

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
        var overdueInvoices = _invoiceRepo.GetAll()
            .Where(i => i.Status == InvoiceStatus.Unpaid && DateTime.UtcNow > i.IssuedAt.AddMinutes(30))
            .ToList();

        int cancelledCount = 0;

        foreach (var invoice in overdueInvoices)
        {
            invoice.Status = InvoiceStatus.Overdue;
            _invoiceRepo.Update(invoice);

            var contract = _contractRepo.GetById(invoice.ContractId);
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