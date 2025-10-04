using PublicCarRental.DTOs.Cont;
using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;
using PublicCarRental.Repository.Cont;
using PublicCarRental.Repository.Staf;
using PublicCarRental.Repository.Trans;
using PublicCarRental.Repository.Vehi;
using PublicCarRental.Service.Inv;
using PublicCarRental.Service.Ren;
using System.Diagnostics.Contracts;

namespace PublicCarRental.Service.Cont
{
    public class ContractService : IContractService
    {
        private readonly IVehicleRepository _vehicleRepo;
        private readonly IContractRepository _contractRepo;
        private readonly IStaffRepository _staffRepo;
        private readonly IHelperService _contInvHelperService;
        private readonly ITransactionRepository _transactionRepository;
        private readonly IEVRenterService _renterService;
        private readonly AzureBlobService _blobService;

        public ContractService(IContractRepository repo, IVehicleRepository vehicleRepo, 
            IStaffRepository staffRepo, IHelperService contInvHelperService, 
            ITransactionRepository transactionRepository, IEVRenterService eVRenterService, 
            AzureBlobService blobService)
        {
            _contractRepo = repo;
            _vehicleRepo = vehicleRepo;
            _staffRepo = staffRepo;
            _contInvHelperService = contInvHelperService;
            _transactionRepository = transactionRepository;
            _renterService = eVRenterService;
            _blobService = blobService;
        }
        public IEnumerable<ContractDto> GetAll()
        {
            return _contractRepo.GetAll()
            .Select(contract => new ContractDto
            {
                ContractId = contract.ContractId,
                InvoiceId = contract.Invoice != null ? contract.Invoice.InvoiceId : null,
                EVRenterId = contract.EVRenterId,
                EVRenterName = contract.EVRenter != null && contract.EVRenter.Account != null ? contract.EVRenter.Account.FullName : null,
                StaffId = contract.StaffId,
                StaffName = contract.Staff != null && contract.Staff.Account != null ? contract.Staff.Account.FullName : null,
                VehicleId = contract.VehicleId ?? 0,
                VehicleLicensePlate = contract.Vehicle != null ? contract.Vehicle.LicensePlate : null,
                StationId = contract.StationId ?? 0,
                StationName = contract.Station != null ? contract.Station.Name : null,
                StartTime = contract.StartTime,
                EndTime = contract.EndTime,
                TotalCost = contract.TotalCost,
                Status = contract.Status,
                ImageIn = contract.ImageUrlIn,
                ImageOut = contract.ImageUrlOut
            })
            .ToList();
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
                Status = contract.Status,
                ImageIn = contract.ImageUrlIn,
                ImageOut = contract.ImageUrlOut
            };
        }

        public RentalContract? GetEntityById(int id)
        {
            return _contractRepo.GetById(id);
        }

        public (bool Success, string Message, int contractId) CreateContract(CreateContractDto dto)
        {
            try
            {
                var vehicle = _vehicleRepo.GetFirstAvailableVehicleByModel(dto.ModelId, dto.StationId, dto.StartTime, dto.EndTime);
                if (vehicle == null)
                    return (false, "Model not available. Choose another time, station, or model.", 0);
                var renter = _renterService.GetEntityById(dto.EVRenterId);
                if (renter == null)
                    return (false, "Renter not found!", 0);

                var contract = new RentalContract
                {
                    EVRenterId = dto.EVRenterId,
                    VehicleId = vehicle.VehicleId,
                    StationId = dto.StationId,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    Status = RentalStatus.ToBeConfirmed,
                };

                var duration = (contract.EndTime - contract.StartTime).TotalHours;
                contract.TotalCost = (decimal)duration * vehicle.Model.PricePerHour;

                _contractRepo.Create(contract);

                return (true, "Please view your contract.", contract.ContractId);
            }
            catch (Exception ex)
            {
                return (false, "Please enter the existing station ID or model ID.", 0);
            }
        }

        public (bool Success, string Message) UpdateContract(int id, UpdateContractDto updatedContract)
        {
            var existing = _contractRepo.GetById(id);
            if (existing == null) return (false, "Vehicle not found!");
            if (existing.Status != RentalStatus.ToBeConfirmed)
                return (false, "Couldn't change contract. Refund or start a new contract instead.");

            var vehicle = _vehicleRepo.GetFirstAvailableVehicleByModel(updatedContract.ModelId, updatedContract.StationId, updatedContract.StartTime, updatedContract.EndTime);
            if (vehicle == null)
                return (false, "Model not available. Choose another time, station, or model.");

            existing.VehicleId = vehicle.VehicleId;
            existing.StaffId = updatedContract.StaffId;
            existing.StationId = updatedContract.StationId;
            existing.StartTime = updatedContract.StartTime;
            existing.EndTime = updatedContract.EndTime;

            var duration = (existing.EndTime - existing.StartTime).TotalHours;
            existing.TotalCost = (decimal)duration * vehicle.Model.PricePerHour;

            _contractRepo.Update(existing);
            return (true, "Contract updated successfully!");
        }

        public async Task<bool> ReturnVehicleAsync(FinishContractDto dto)
        {
            var contract = _contractRepo.GetById(dto.ContractId);
            if (contract == null) return false;

            var vehicle = _vehicleRepo.GetById((int)contract.VehicleId);

            contract.EndTime = DateTime.UtcNow;
            contract.Status = RentalStatus.Completed;

            var duration = (contract.EndTime - contract.StartTime).TotalHours;
            contract.TotalCost = (decimal)duration * vehicle.Model.PricePerHour;

            vehicle.Status = VehicleStatus.ToBeCheckup;

            if (dto.imageFile != null && dto.imageFile.Length > 0)
            {
                contract.ImageUrlOut = await _blobService.UploadImageAsync(dto.imageFile);
            }

            _vehicleRepo.Update(vehicle);
            _contractRepo.Update(contract);

            return true;
        }

        public async Task<bool> StartRentalAsync(ConfirmContractDto dto)
        {
            var contract = _contractRepo.GetById(dto.ContractId);
            if (contract == null || contract.Status != RentalStatus.Confirmed)
                throw new InvalidOperationException("Invoice for Contract is Pending");

            var vehicle = contract.Vehicle;
            if (vehicle == null)
                throw new InvalidOperationException("Vehicle not found");

            contract.Status = RentalStatus.Active;
            contract.StartTime = DateTime.UtcNow;
            contract.StaffId = dto.StaffId;

            if (dto.ImageFile != null && dto.ImageFile.Length > 0)
            {
                contract.ImageUrlIn = await _blobService.UploadImageAsync(dto.ImageFile);
            }

            vehicle.Status = VehicleStatus.Renting;
            _vehicleRepo.Update(vehicle);
            _contractRepo.Update(contract);

            return true;
        }

        public IEnumerable<ContractDto> GetContractByRenterId(int renterId)
        {
            var contracts = _contractRepo.GetAll()
            .Where(r => r.EVRenter.RenterId == renterId)
            .ToList();

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

        public bool UpdateContractStatus(int contractId, RentalStatus status)
        {
            try
            {
                var contract = _contractRepo.GetById(contractId);
                if (contract == null) 
                {
                    Console.WriteLine($"ContractService: Contract {contractId} not found");
                    return false;
                }

                Console.WriteLine($"ContractService: Updating contract {contractId} from {contract.Status} to {status}");
                contract.Status = status;
                _contractRepo.Update(contract);
                Console.WriteLine($"ContractService: Contract {contractId} updated successfully to {status}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ContractService: Error updating contract {contractId}: {ex.Message}");
                Console.WriteLine($"ContractService: Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        public (bool Success, string Message) DeleteContract(int contractId)
        {
            var contract = _contractRepo.GetById(contractId);
            if (contract == null) return (false, "Contract not found");

            if (contract.Status != RentalStatus.ToBeConfirmed || contract.Status != RentalStatus.Cancelled) 
            return (false, $"Contract {contractId} is not in a cancellable state");
            _contractRepo.Delete(contractId);
            return (true, $"Contract {contractId} deleted successfully");
        }

    }
}
