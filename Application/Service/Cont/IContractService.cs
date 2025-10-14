using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Cont
{
    public interface IContractService
    {
        public IEnumerable<ContractDto> GetAll();
        public ContractDto GetById(int id);
        RentalContract? GetEntityById(int id);
        Task<(bool Success, string Message)> UpdateContractAsync(int id, UpdateContractDto updatedContract);
        Task<(bool Success, string Message, int contractId)> CreateContractAsync(CreateContractDto dto);
        Task<bool> StartRentalAsync(ConfirmContractDto dto);
        Task<bool> ReturnVehicleAsync(FinishContractDto dto);
        public IEnumerable<ContractDto> GetContractByRenterId(int renterId);
        public bool UpdateContractStatus(int contractId, RentalStatus status);
        public (bool Success, string Message) DeleteContract(int contractId);
        public IEnumerable<ContractDto> GetContractByStationId(int stationId);

    }
}
