using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Application.Service.PDF;
using PublicCarRental.Application.Service.Rabbit;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Application.Service.Ren;
using PublicCarRental.Application.Service.Staf;
using PublicCarRental.Application.Service.Trans;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Inv;
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
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IBookingService _bookingService;
        private readonly IStaffService _staffService;
        private readonly IReceiptGenerationProducerService _receiptGenerationProducerService;
        private readonly IContractGenerationProducerService _contractGenerationProducer;
        private readonly ITransactionService _transactionService;

        public ContractService(IContractRepository repo, IVehicleRepository vehicleRepo, IEVRenterService eVRenterService, 
            BookingEventProducerService bookingEventProducerService, IImageStorageService imageStorageService,
            ILogger<ContractService> logger, IDistributedLockService distributedLock, IStaffService staffService,
            IInvoiceRepository invoiceRepository, IBookingService bookingService, IReceiptGenerationProducerService receiptGenerationProducerService, 
            IContractGenerationProducerService contractGenerationProducer, ITransactionService transactionService)
        {
            _contractRepo = repo;
            _vehicleRepo = vehicleRepo;
            _renterService = eVRenterService;
            _imageStorageService = imageStorageService;
            _bookingEventProducer = bookingEventProducerService;
            _logger = logger;
            _distributedLock = distributedLock;
            _invoiceRepository = invoiceRepository;
            _bookingService = bookingService;
            _staffService = staffService;
            _receiptGenerationProducerService = receiptGenerationProducerService;
            _contractGenerationProducer = contractGenerationProducer;
            _transactionService = transactionService;
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

        public async Task<(bool Success, string Message, int contractId)> ConfirmBookingAfterPaymentAsync(int invoiceId)
        {
            var invoice = _invoiceRepository.GetById(invoiceId);
            if (invoice?.Status != InvoiceStatus.Paid)
                return (false, "You must pay your invoice first!", 0);

            var bookingRequest = await _bookingService.GetBookingRequest(invoice.BookingToken);
            if (bookingRequest == null)
                return (false, "Booking request not found or expired", 0);

            var vehicle = _vehicleRepo.GetById(bookingRequest.VehicleId);

            var contract = new RentalContract
            {
                EVRenterId = bookingRequest.EVRenterId,
                VehicleId = bookingRequest.VehicleId,
                StationId = bookingRequest.StationId,
                StartTime = bookingRequest.StartTime,
                EndTime = bookingRequest.EndTime,
                TotalCost = bookingRequest.TotalCost,
                Status = RentalStatus.Confirmed
            };

            _contractRepo.Create(contract);

            invoice.ContractId = contract.ContractId;
            _invoiceRepository.Update(invoice);

            try
            {
                _transactionService.CreateTransaction(contract.ContractId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create transaction for contract {ContractId}", contract.ContractId);
            }

            _bookingService.RemoveBookingRequest(invoice.BookingToken);

            var lockKey = $"vehicle_booking:{bookingRequest.VehicleId}:{bookingRequest.StartTime:yyyyMMddHHmm}";
            _distributedLock.ReleaseLock(lockKey);

            _ = Task.Run(async () =>
            {
                try
                {
                    var bookingEvent = new BookingCreatedEvent
                    {
                        BookingId = contract.ContractId,
                        RenterId = bookingRequest.EVRenterId, 
                        VehicleId = vehicle.VehicleId,
                        StationId = contract.StationId ?? 0,
                        StartTime = contract.StartTime,
                        EndTime = contract.EndTime,
                        TotalCost = contract.TotalCost.Value,
                    };

                    await _bookingEventProducer.PublishBookingCreatedAsync(bookingEvent);

                    var renter = await _renterService.GetByIdAsync(bookingRequest.EVRenterId);

                    await _receiptGenerationProducerService.PublishReceiptGenerationAsync(
                        invoice.InvoiceId,
                        contract.ContractId,
                        bookingRequest.EVRenterId,
                        renter?.Email,     
                        renter?.FullName   
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to publish events for contract {ContractId}", contract.ContractId);
                }
            });

            return (true, "Booking confirmed! Contract created.", contract.ContractId);
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

            // Get renter information
            var renter = await _renterService.GetByIdAsync(contract.EVRenterId);
            if (renter == null)
                throw new InvalidOperationException("Renter not found");

            var staff = _staffService.GetEntityById(dto.StaffId);
            var staffName = staff?.Account?.FullName;

            // Update contract status
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

            // Queue contract generation (REMOVE direct PDF generation)
            await _contractGenerationProducer.PublishContractGenerationAsync(
                contract.ContractId,
                renter.Email,
                renter.FullName,
                includeStaffSignature: true,
                staffName: staffName
            );

            try
            {
                var bookingEvent = new BookingConfirmedEvent
                {
                    BookingId = contract.ContractId,
                    RenterId = contract.EVRenterId,
                    RenterEmail = renter.Email,
                    RenterName = renter.FullName,
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
