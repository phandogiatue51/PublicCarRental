using PublicCarRental.DTOs.Cont;
using PublicCarRental.DTOs.Inv;
using PublicCarRental.Models;
using PublicCarRental.Repository.Cont;
using PublicCarRental.Repository.Staf;
using PublicCarRental.Repository.Trans;
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
        private readonly IHelperService _contInvHelperService;
        private readonly ITransactionRepository _transactionRepository;

        public ContractService(IContractRepository repo, IVehicleRepository vehicleRepo, 
            IStaffRepository staffRepo, IHelperService contInvHelperService, ITransactionRepository transactionRepository)
        {
            _contractRepo = repo;
            _vehicleRepo = vehicleRepo;
            _staffRepo = staffRepo;
            _contInvHelperService = contInvHelperService;
            _transactionRepository = transactionRepository;
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

        public int CreateContract(CreateContractDto dto)
        {
            var vehicle = _vehicleRepo.GetFirstAvailableVehicleByModel(dto.ModelId, dto.StationId, dto.StartTime, dto.EndTime);
            if (vehicle == null)
                throw new InvalidOperationException("Vehicle not available");

            var contract = new RentalContract
            {
                EVRenterId = dto.EVRenterId,
                VehicleId = vehicle.VehicleId,
                StationId = dto.StationId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = RentalStatus.ToBeConfirmed,
            };
            Console.WriteLine($"Contract created with VehicleId: {contract.VehicleId}");

            var duration = (contract.EndTime - contract.StartTime).TotalHours;
            contract.TotalCost = (decimal)duration * vehicle.Model.PricePerHour;

            _contractRepo.Create(contract);

            return contract.ContractId;
        }

        public bool UpdateContract(int id, UpdateContractDto updatedContract)
        {
            var existing = _contractRepo.GetById(id);
            if (existing == null) return false;
            if (existing.Status != RentalStatus.ToBeConfirmed)
                throw new InvalidOperationException("Couldn't change contract. Refund or start a new contract instead.");

            var vehicle = _vehicleRepo.GetFirstAvailableVehicleByModel(updatedContract.ModelId, updatedContract.StationId, updatedContract.StartTime, updatedContract.EndTime);
            if (vehicle == null)
                throw new InvalidOperationException("Vehicle not available");

            existing.VehicleId = vehicle.VehicleId;
            existing.StaffId = updatedContract.StaffId;
            existing.StationId = updatedContract.StationId;
            existing.StartTime = updatedContract.StartTime;
            existing.EndTime = updatedContract.EndTime;

            var duration = (existing.EndTime - existing.StartTime).TotalHours;
            existing.TotalCost = (decimal)duration * vehicle.Model.PricePerHour;

            _contractRepo.Update(existing);
            return true;
        }

        public bool ReturnVehicle(FinishContractDto dto)
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
                // Save the uploaded file to image/models directory
                var imagePath = Path.Combine("image", "models");
                if (!Directory.Exists(imagePath))
                {
                    Directory.CreateDirectory(imagePath);
                }

                var fileName = Path.GetFileName(dto.imageFile.FileName);
                var filePath = Path.Combine(imagePath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    dto.imageFile.CopyTo(stream);
                }

                contract.ImageUrlOut = $"/image/contracts/{fileName}";
            }

            _vehicleRepo.Update(vehicle);
            _contractRepo.Update(contract);

            return true;
        }

        public bool StartRental(ConfirmContractDto dto)
        {
            var contract = _contractRepo.GetById(dto.ContractId);
            if (contract == null || contract.Status != RentalStatus.Confirmed)
                throw new InvalidOperationException("Invoice for Contract is Unpaid");

            var vehicle = contract.Vehicle;
            if (vehicle == null)
                throw new InvalidOperationException("Vehicle not found");

            contract.Status = RentalStatus.Active;
            contract.StartTime = DateTime.UtcNow;
            contract.StaffId = dto.StaffId;

            if (dto.imageFile != null && dto.imageFile.Length > 0)
            {
                // Save the uploaded file to image/models directory
                var imagePath = Path.Combine("image", "models");
                if (!Directory.Exists(imagePath))
                {
                    Directory.CreateDirectory(imagePath);
                }

                var fileName = Path.GetFileName(dto.imageFile.FileName);
                var filePath = Path.Combine(imagePath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    dto.imageFile.CopyTo(stream);
                }

                contract.ImageUrlIn = $"/image/contracts/{fileName}";
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

        public bool UpdateContractStatus(int contractId)
        {
            var contract = _contractRepo.GetById(contractId);
            if (contract == null) return false;

            contract.Status = RentalStatus.Confirmed;
            _contractRepo.Update(contract);
            return true;
        }

        public bool CancelContract(RentalContract contract)
        {
            if (contract == null) return false;
            if (contract.Status != RentalStatus.ToBeConfirmed && contract.Status != RentalStatus.Completed)
                return false;

            contract.Status = RentalStatus.Cancelled;
            _contractRepo.Update(contract);
            return true;
        }
    }
}
