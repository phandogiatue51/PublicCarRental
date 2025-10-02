using PublicCarRental.Models;

namespace PublicCarRental.Service
{
    public interface IHelperService
    {
        public RentalContract GetContractById(int contractId);
        public int AutoCancelOverdueInvoices();

    }
}
