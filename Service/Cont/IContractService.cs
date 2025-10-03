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
        public (bool Success, string Message) UpdateContract(int id, UpdateContractDto updatedContract);
        public (bool Success, string Message, int contractId) CreateContract(CreateContractDto dto);
        public bool StartRental(ConfirmContractDto dto);
        public bool ReturnVehicle(FinishContractDto dto);
        public IEnumerable<ContractDto> GetContractByRenterId(int renterId);
        public bool UpdateContractStatus(int contractId, RentalStatus status);
    }
}
