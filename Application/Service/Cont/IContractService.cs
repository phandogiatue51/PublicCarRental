using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Cont
{
    public interface IContractService
    {
        public IEnumerable<ContractDto> GetAll();
        public ContractReadDto GetById(int id);
        RentalContract? GetEntityById(int id);
        Task<(bool Success, string Message)> UpdateContractAsync(int id, UpdateContractDto updatedContract);
        Task<(bool Success, string Message, int contractId)> ConfirmBookingAfterPaymentAsync(int invoiceId);

        Task<bool> StartRentalAsync(ConfirmContractDto dto);
        Task<bool> ReturnVehicleAsync(FinishContractDto dto);
        public IEnumerable<ContractDto> GetContractByRenterId(int renterId);
        public bool UpdateContractStatus(int contractId, RentalStatus status);
        public (bool Success, string Message) DeleteContract(int contractId);
        public IEnumerable<ContractDto> GetContractByStationId(int stationId);
        public IEnumerable<ContractDto> FilterContracts(int? stationId, RentalStatus? status, int? renterId, int? staffId, int? vehicleId);

    }
}
