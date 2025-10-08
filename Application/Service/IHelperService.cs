using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service
{
    public interface IHelperService
    {
        public RentalContract GetContractById(int contractId);
        public int AutoCancelOverdueInvoices();

    }
}
