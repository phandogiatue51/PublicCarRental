using PublicCarRental.DTOs;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Cont
{
    public interface IContractService
    {
        IEnumerable<RentalContract> GetAllContracts();
        RentalContract? GetContractById(int id);
        public int CreateContract(RentRequestDto dto);
        public bool ConfirmContract(HandoverDto dto);
        public bool ReturnVehicle(ReturnDto dto);
    }
}
