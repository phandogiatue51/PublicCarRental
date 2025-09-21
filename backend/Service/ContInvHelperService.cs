using PublicCarRental.Models;
using PublicCarRental.Repository.Cont;
using PublicCarRental.Repository.Inv;
using PublicCarRental.Service;

public class ContInvHelperService : IContInvHelperService
{
    private readonly IContractRepository _contractRepo;
    private readonly IInvoiceRepository _invoiceRepo;

    public ContInvHelperService(IContractRepository contractRepo, IInvoiceRepository invoiceRepo)
    {
        _contractRepo = contractRepo;
        _invoiceRepo = invoiceRepo;
    }

    public RentalContract GetContractById(int contractId)
    {
        return _contractRepo.GetById(contractId);
    }

    public bool IsInvoicePaid(int contractId)
    {
        var invoice = _invoiceRepo.GetByContractId(contractId);
        return invoice != null && invoice.Status == InvoiceStatus.Paid;
    }
}