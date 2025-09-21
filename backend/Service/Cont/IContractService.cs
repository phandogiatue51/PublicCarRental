using PublicCarRental.DTOs.Cont;
using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Cont
{
    public interface IContractService
    {
        public IEnumerable<ContractDto> GetAll();
        public ContractDto GetById(int id);
        RentalContract? GetEntityById(int id);
        public bool UpdateContract(int id, UpdateContractDto updatedContract);
        public int CreateContract(CreateContractDto dto);
        public bool ConfirmContract(ConfirmContractDto dto);
        public bool ReturnVehicle(InvoiceCreateDto dto);
    }
}
