using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Cont
{
    public interface IContractService
    {
        public IEnumerable<ContractDto> GetAll();
        public ContractDto GetById(int id);
        RentalContract? GetEntityById(int id);
        public (bool Success, string Message) UpdateContract(int id, UpdateContractDto updatedContract);
        public (bool Success, string Message, int contractId) CreateContract(CreateContractDto dto);
        Task<bool> StartRentalAsync(ConfirmContractDto dto);
        Task<bool> ReturnVehicleAsync(FinishContractDto dto);
        public IEnumerable<ContractDto> GetContractByRenterId(int renterId);
        public bool UpdateContractStatus(int contractId, RentalStatus status);
        public (bool Success, string Message) DeleteContract(int contractId);
        public IEnumerable<ContractDto> GetContractByStationId(int stationId);

    }
}
