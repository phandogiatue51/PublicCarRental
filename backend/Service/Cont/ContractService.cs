using PublicCarRental.DTOs;
using PublicCarRental.Models;
using PublicCarRental.Repository.Cont;
using PublicCarRental.Repository.Staf;
using PublicCarRental.Repository.Vehi;
using PublicCarRental.Service.Inv;

namespace PublicCarRental.Service.Cont
{
    public class ContractService : IContractService
    {
        private readonly IVehicleRepository _vehicleRepo;
        private readonly IContractRepository _contractRepo;
        private readonly IInvoiceService _invoiceService;
        private readonly IStaffRepository _staffRepo;

        public ContractService(IContractRepository repo, IVehicleRepository vehicleRepo, 
            IInvoiceService invoiceService, IStaffRepository staffRepo)
        {
            _contractRepo = repo;
            _vehicleRepo = vehicleRepo;
            _invoiceService = invoiceService;
            _staffRepo = staffRepo;
        }

        public IEnumerable<RentalContract> GetAllContracts()
        {
            return _contractRepo.GetAll();
        }

        public RentalContract? GetContractById(int id)
        {
            return _contractRepo.GetById(id);
        }

        public int CreateContract(RentRequestDto dto)
        {
            var vehicle = _vehicleRepo.GetById(dto.VehicleId);
            if (vehicle == null || vehicle.Status != VehicleStatus.Available)
                throw new InvalidOperationException("Vehicle not available");

            var contract = new RentalContract
            {
                EVRenterId = dto.EVRenterId,
                VehicleId = dto.VehicleId,
                StationId = dto.StationId,
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(dto.RentalHours),
                Status = RentalStatus.ToBeConfirmed,
                TotalCost = (decimal)dto.RentalHours * vehicle.PricePerHour
            };

            vehicle.Status = VehicleStatus.ToBeRented;
            _vehicleRepo.Update(vehicle);
            _contractRepo.Create(contract);

            _invoiceService.CreateInvoice(contract.ContractId, contract.TotalCost ?? 0);

            return contract.ContractId;
        }

        public bool UpdateContract(int id, RentalContract updatedContract)
        {
            var existing = _contractRepo.GetById(id);
            if (existing == null) return false;

            existing.Status = updatedContract.Status;
            existing.EndTime = updatedContract.EndTime;
            existing.TotalCost = updatedContract.TotalCost;
            existing.Status = updatedContract.Status;

            existing.VehicleConditionOnReturn = updatedContract.VehicleConditionOnReturn;

            _contractRepo.Update(existing);
            return true;
        }

        public bool ConfirmContract(HandoverDto dto)
        {
            var contract = _contractRepo.GetById(dto.ContractId);
            if (contract == null) return false;

            if (!_invoiceService.IsInvoicePaid(contract.ContractId))
                throw new InvalidOperationException("Invoice must be paid before confirming contract");

            var staff = _staffRepo.GetById(dto.StaffId);
            if (staff == null) throw new InvalidOperationException("Invalid staff ID");

            contract.VehicleConditionOnPickup = dto.Condition;
            contract.StaffId = dto.StaffId;
            contract.Status = RentalStatus.Active;

            contract.Vehicle.Status = VehicleStatus.Renting;
            _vehicleRepo.Update(contract.Vehicle);
            _contractRepo.Update(contract);

            return true;
        }

        public bool ReturnVehicle(ReturnDto dto)
        {
            var contract = _contractRepo.GetById(dto.ContractId);
            if (contract == null) return false;

            var vehicle = contract.Vehicle;
            if (vehicle == null) throw new InvalidOperationException("Vehicle not found");

            contract.EndTime = DateTime.UtcNow;
            contract.VehicleConditionOnReturn = dto.Condition;
            contract.Status = RentalStatus.Completed;

            var duration = (contract.EndTime.Value - contract.StartTime.Value).TotalHours;
            contract.TotalCost = (decimal)duration * vehicle.PricePerHour;

            vehicle.Status = VehicleStatus.ToBeCheckup;

            _vehicleRepo.Update(vehicle);
            _contractRepo.Update(contract);

            return true;
        }
    }
}
