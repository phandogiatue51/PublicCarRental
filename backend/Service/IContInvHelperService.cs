using PublicCarRental.Models;

namespace PublicCarRental.Service
{
    public interface IContInvHelperService
    {
        public RentalContract GetContractById(int contractId);
        public bool IsInvoicePaid(int contractId);
    }
}
