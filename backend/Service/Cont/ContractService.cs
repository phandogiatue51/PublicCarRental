using PublicCarRental.DTOs.Cont;
using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;
using PublicCarRental.Repository.Cont;
using PublicCarRental.Repository.Staf;
using PublicCarRental.Repository.Vehi;
using PublicCarRental.Service.Inv;
using System.Diagnostics.Contracts;

namespace PublicCarRental.Service.Cont
{
    public class ContractService : IContractService
    {
        private readonly IVehicleRepository _vehicleRepo;
        private readonly IContractRepository _contractRepo;
        private readonly IStaffRepository _staffRepo;
        private readonly IContInvHelperService _contInvHelperService;

        public ContractService(IContractRepository repo, IVehicleRepository vehicleRepo, 
            IStaffRepository staffRepo, IContInvHelperService contInvHelperService)
        {
            _contractRepo = repo;
            _vehicleRepo = vehicleRepo;
            _staffRepo = staffRepo;
            _contInvHelperService = contInvHelperService;
        }

        public IEnumerable<ContractDto> GetAll()
        {
            var contracts = _contractRepo.GetAll();

            return contracts.Select(contract => new ContractDto
            {
                ContractId = contract.ContractId,
                InvoiceId = contract.Invoice?.InvoiceId,
                EVRenterId = contract.EVRenterId,
                EVRenterName = contract.EVRenter?.Account?.FullName,
                StaffId = contract.StaffId,
                StaffName = contract.Staff?.Account?.FullName,
                VehicleId = contract.VehicleId ?? 0,
                VehicleLicensePlate = contract.Vehicle?.LicensePlate,
                StationId = contract.StationId ?? 0,
                StationName = contract.Station?.Name,
                StartTime = contract.StartTime,
                EndTime = contract.EndTime,
                TotalCost = contract.TotalCost,
                Status = contract.Status
            });
        }

        public ContractDto GetById(int id)
        {
            var contract = _contractRepo.GetById(id);
            if (contract == null) return null;
            return new ContractDto
            {
                ContractId = contract.ContractId,
                InvoiceId = contract.Invoice?.InvoiceId,
                EVRenterId = contract.EVRenterId,
                EVRenterName = contract.EVRenter?.Account?.FullName,
                StaffId = contract.StaffId,
                StaffName = contract.Staff?.Account?.FullName,
                VehicleId = contract.VehicleId ?? 0,
                VehicleLicensePlate = contract.Vehicle?.LicensePlate,
                StationId = contract.StationId ?? 0,
                StationName = contract.Station?.Name,
                StartTime = contract.StartTime,
                EndTime = contract.EndTime,
                TotalCost = contract.TotalCost,
                Status = contract.Status
            };
        }

        public RentalContract? GetEntityById(int id)
        {
            return _contractRepo.GetById(id);
        }

        public int CreateContract(CreateContractDto dto)
        {
            var vehicle = _vehicleRepo.GetFirstAvailableVehicleByModel(dto.ModelId);
            if (vehicle == null)
                throw new InvalidOperationException("Vehicle not available");

            var contract = new RentalContract
            {
                EVRenterId = dto.EVRenterId,
                VehicleId = vehicle.VehicleId,
                StationId = dto.StationId,
                StartTime = dto.StartTime ?? DateTime.UtcNow,
                EndTime = dto.EndTime,
                Status = RentalStatus.ToBeConfirmed,
            };
            Console.WriteLine($"Contract created with VehicleId: {contract.VehicleId}");

            var duration = (contract.EndTime.Value - contract.StartTime.Value).TotalHours;
            contract.TotalCost = (decimal)duration * vehicle.PricePerHour;

            vehicle.Status = VehicleStatus.ToBeRented;
            _vehicleRepo.Update(vehicle);

            _contractRepo.Create(contract);

            return contract.ContractId;
        }

        public bool UpdateContract(int id, UpdateContractDto updatedContract)
        {
            var existing = _contractRepo.GetById(id);
            if (existing == null) return false;

            var existingvehicle = existing.Vehicle;
            existingvehicle.Status = VehicleStatus.Available;
            _vehicleRepo.Update(existingvehicle);

            var vehicle = _vehicleRepo.GetFirstAvailableVehicleByModel(updatedContract.ModelId);
            if (vehicle == null)
                throw new InvalidOperationException("Vehicle not available");

            existing.VehicleId = vehicle.VehicleId;
            existing.StaffId = updatedContract.StaffId;
            existing.StationId = updatedContract.StationId;
            existing.StartTime = updatedContract.StartTime ?? existing.StartTime;
            existing.EndTime = updatedContract.EndTime ?? existing.EndTime;

            var duration = (existing.EndTime.Value - existing.StartTime.Value).TotalHours;
            existing.TotalCost = (decimal)duration * existing.Vehicle.PricePerHour;

            vehicle.Status = VehicleStatus.ToBeRented;
            _vehicleRepo.Update(vehicle);

            _contractRepo.Update(existing);
            return true;
        }

        public bool ConfirmContract(ConfirmContractDto dto)
        {
            var contract = _contractRepo.GetById(dto.ContractId);
            if (contract.Status != RentalStatus.ToBeConfirmed)
                throw new InvalidOperationException("Contract is not in a confirmable state");

            if (contract == null) return false;

            if (!_contInvHelperService.IsInvoicePaid(dto.ContractId))
                throw new InvalidOperationException("Invoice must be paid before confirming contract");

            var staff = _staffRepo.GetById(dto.StaffId);
            if (staff == null) throw new InvalidOperationException("Invalid staff ID");

            contract.StartTime = DateTime.UtcNow;
            contract.StaffId = dto.StaffId;
            contract.Status = RentalStatus.Active;

            contract.Vehicle.Status = VehicleStatus.Renting;
            _vehicleRepo.Update(contract.Vehicle);
            _contractRepo.Update(contract);

            return true;
        }

        public bool ReturnVehicle(InvoiceCreateDto dto)
        {
            var contract = _contractRepo.GetById(dto.ContractId);
            if (contract == null) return false;

            var vehicle = contract.Vehicle;
            if (vehicle == null) throw new InvalidOperationException("Vehicle not found");

            contract.EndTime = DateTime.UtcNow;
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
