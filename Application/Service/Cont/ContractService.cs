using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Application.Service.Rabbit;
using PublicCarRental.Application.Service.Ren;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Vehi;

namespace PublicCarRental.Application.Service.Cont
{
    public class ContractService : IContractService
    {
        private readonly IContractRepository _contractRepo;
        private readonly IEVRenterService _renterService;
        private readonly BookingEventProducerService _bookingEventProducer; 
        private readonly ILogger<ContractService> _logger;
        private readonly IImageStorageService _imageStorageService;
        private readonly IDistributedLockService _distributedLock;
        private readonly IVehicleRepository _vehicleRepo;

        public ContractService(IContractRepository repo, IVehicleRepository vehicleRepo, IEVRenterService eVRenterService, 
            BookingEventProducerService bookingEventProducerService, IImageStorageService imageStorageService,
            ILogger<ContractService> logger, IDistributedLockService distributedLock)
        {
            _contractRepo = repo;
            _vehicleRepo = vehicleRepo;
            _renterService = eVRenterService;
            _imageStorageService = imageStorageService;
            _bookingEventProducer = bookingEventProducerService;
            _logger = logger;
            _distributedLock = distributedLock;
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

        public async Task<(bool Success, string Message, int contractId)> CreateContractAsync(CreateContractDto dto)
        {
            var lockKey = $"contract_create:{dto.ModelId}:{dto.StationId}:{dto.StartTime:yyyyMMddHHmm}";
            try
            {
                if (!await _distributedLock.AcquireLockAsync(lockKey, TimeSpan.FromSeconds(5)))
                    return (false, "Please try again. Someone is booking the same vehicle.", 0);

                var vehicle = await _vehicleRepo.GetFirstAvailableVehicleByModelAsync(dto.ModelId, dto.StationId, dto.StartTime, dto.EndTime);
                if (vehicle == null)
                    return (false, "Model not available. Choose another time, station, or model.", 0);
                var renter = await _renterService.GetByIdAsync(dto.EVRenterId);
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

                _ = Task.Run(async () =>
                {
                    try
                    {
                        var bookingEvent = new BookingCreatedEvent
                        {
                            BookingId = contract.ContractId,
                            RenterId = renter.RenterId,
                            RenterEmail = renter.Email,
                            RenterName = renter.FullName,
                            VehicleId = vehicle.VehicleId,
                            VehicleLicensePlate = vehicle.LicensePlate,
                            StationId = contract.StationId ?? 0,
                            StationName = vehicle.Station?.Name,
                            StartTime = contract.StartTime,
                            EndTime = contract.EndTime,
                            TotalCost = (decimal)contract.TotalCost
                        };

                        await _bookingEventProducer.PublishBookingCreatedAsync(bookingEvent);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to publish BookingCreated event for contract {ContractId}", contract.ContractId);
                    }
                });

                return (true, "Please view your contract.", contract.ContractId);
            }
            catch (Exception ex)
            {
                return (false, "Please enter the existing station ID or model ID.", 0);
            }
            finally
            {
                await _distributedLock.ReleaseLockAsync(lockKey);
            }
        }

        public async Task<(bool Success, string Message)> UpdateContractAsync(int id, UpdateContractDto updatedContract)
        {
            var existing = _contractRepo.GetById(id);
            if (existing == null) return (false, "Vehicle not found!");
            if (existing.Status != RentalStatus.ToBeConfirmed)
                return (false, "Couldn't change contract. Refund or start a new contract instead.");

            var vehicle = await _vehicleRepo.GetFirstAvailableVehicleByModelAsync(updatedContract.ModelId, updatedContract.StationId, updatedContract.StartTime, updatedContract.EndTime);
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
                contract.ImageUrlOut = await _imageStorageService.UploadImageAsync(dto.imageFile);
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
                contract.ImageUrlIn = await _imageStorageService.UploadImageAsync(dto.ImageFile);
            }

            vehicle.Status = VehicleStatus.Renting;
            _vehicleRepo.Update(vehicle);
            _contractRepo.Update(contract);

            try
            {
                var bookingEvent = new BookingConfirmedEvent
                {
                    BookingId = contract.ContractId,
                    RenterId = contract.EVRenterId,
                    RenterEmail = contract.EVRenter?.Account?.Email,
                    RenterName = contract.EVRenter?.Account?.FullName,
                    StartTime = contract.StartTime,
                    EndTime = contract.EndTime,
                    TotalCost = (decimal)contract.TotalCost
                };

                await _bookingEventProducer.PublishBookingConfirmedAsync(bookingEvent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish BookingConfirmed event for contract {ContractId}", contract.ContractId);
            }

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

        public IEnumerable<ContractDto> GetContractByStationId(int stationId)
        {
            var contracts = _contractRepo.GetAll()
            .Where(r => r.Station.StationId == stationId)
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
    }
}
