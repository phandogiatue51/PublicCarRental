using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.DTOs.Inv;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Application.Service.PDF;
using PublicCarRental.Application.Service.Rabbit;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Application.Service.Ren;
using PublicCarRental.Application.Service.Staf;
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

        public ContractService(IContractRepository repo, IVehicleRepository vehicleRepo, IEVRenterService eVRenterService,
            BookingEventProducerService bookingEventProducerService, IImageStorageService imageStorageService,
            ILogger<ContractService> logger, IDistributedLockService distributedLock, IStaffService staffService,
            IInvoiceRepository invoiceRepository, IBookingService bookingService, IReceiptGenerationProducerService receiptGenerationProducerService,
            IContractGenerationProducerService contractGenerationProducer)
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
        }

        public IEnumerable<ContractDto> GetAll()
        {
            return _contractRepo.GetAll().ToList()
            .Select(contract => new ContractDto
            {
                ContractId = contract.ContractId,
                InvoiceCount = contract.Invoices?.Count ?? 0,
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
                ImageOut = contract.ImageUrlOut,
                Notes = contract.Note,
                IsRated = contract.IsRated
            });
        }

        public ContractReadDto GetById(int id)
        {
            var contract = _contractRepo.GetById(id);
            if (contract == null) return null;

            return new ContractReadDto
            {
                ContractId = contract.ContractId,
                EVRenterId = contract.EVRenterId,
                EVRenterName = contract.EVRenter?.Account?.FullName,
                PhoneNumber = contract.EVRenter?.Account?.PhoneNumber,
                StaffId = contract.StaffId,
                StaffName = contract.Staff?.Account?.FullName,
                ModelName = contract.Vehicle?.Model?.Name,
                VehicleId = contract.VehicleId ?? 0,
                VehicleLicensePlate = contract.Vehicle?.LicensePlate,
                StationId = contract.StationId ?? 0,
                StationName = contract.Station?.Name,
                StartTime = contract.StartTime,
                EndTime = contract.EndTime,
                TotalCost = contract.TotalCost,
                Status = contract.Status,
                ImageIn = contract.ImageUrlIn,
                ImageOut = contract.ImageUrlOut,
                Notes = contract.Note,
                Invoices = contract.Invoices?.Select(i => new InvoiceDto
                {
                    InvoiceId = i.InvoiceId,
                    ContractId = i.ContractId,
                    IssuedAt = i.IssuedAt,
                    AmountDue = i.AmountDue,
                    AmountPaid = i.AmountPaid,
                    PaidAt = i.PaidAt,
                    Status = i.Status,
                    OrderCode = i.OrderCode,
                    Note = i.Note
                }).ToList()
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

            _bookingService.RemoveBookingRequest(invoice.BookingToken);

            var lockKey = $"vehicle_booking:{bookingRequest.VehicleId}:{bookingRequest.StartTime:yyyyMMddHHmm}_{bookingRequest.EndTime:yyyyMMddHHmm}";
            _distributedLock.ReleaseLock(lockKey, invoice.BookingToken);

            var renter = await _renterService.GetByIdAsync(bookingRequest.EVRenterId);

            _logger.LogInformation("🚀 Starting background tasks for contract {ContractId} - Booking event and receipt generation", contract.ContractId);

            _ = Task.Run(async () =>
            {
                try
                {
                    _logger.LogInformation("📋 Publishing booking created event for contract {ContractId}", contract.ContractId);
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
                    _logger.LogInformation("✅ Booking created event published for contract {ContractId}", contract.ContractId);

                    _logger.LogInformation("🧾 Publishing receipt generation event for contract {ContractId}, invoice {InvoiceId}", contract.ContractId, invoice.InvoiceId);
                    await _receiptGenerationProducerService.PublishReceiptGenerationAsync(
                        invoice.InvoiceId,
                        contract.ContractId,
                        bookingRequest.EVRenterId,
                        renter?.Email,
                        renter?.FullName
                    );
                    _logger.LogInformation("✅ Receipt generation event published for contract {ContractId}", contract.ContractId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Failed to publish events for contract {ContractId}", contract.ContractId);
                }
            });

            return (true, "Booking confirmed! Contract created.", contract.ContractId);
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
            _logger.LogInformation("📄 Publishing contract generation event for contract {ContractId}", contract.ContractId);
            await _contractGenerationProducer.PublishContractGenerationAsync(
                contract.ContractId,
                renter.Email,
                renter.FullName,
                includeStaffSignature: true,
                staffName: staffName
            );
            _logger.LogInformation("✅ Contract generation event published for contract {ContractId}", contract.ContractId);

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
                IsRated = contract.IsRated
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
                InvoiceCount = contract.Invoices?.Count ?? 0,
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

        public IEnumerable<ContractDto> FilterContracts(int? stationId, RentalStatus? status, int? renterId, int? staffId,
            int? vehicleId, DateTime? startTime, DateTime? endTime)
        {
            var query = _contractRepo.GetAll().AsQueryable();

            if (stationId.HasValue)
                query = query.Where(c => c.StationId == stationId.Value);

            if (status.HasValue)
                query = query.Where(c => c.Status == status.Value);

            if (renterId.HasValue)
                query = query.Where(c => c.EVRenterId == renterId.Value);

            if (staffId.HasValue)
                query = query.Where(c => c.StaffId == staffId.Value);

            if (vehicleId.HasValue)
                query = query.Where(c => c.VehicleId == vehicleId.Value);

            if (startTime.HasValue)
                query = query.Where(c => c.StartTime >= startTime.Value);

            if (endTime.HasValue)
                query = query.Where(c => c.EndTime <= endTime.Value);

            var contracts = query.ToList();

            return contracts.Select(contract => new ContractDto
            {
                ContractId = contract.ContractId,
                InvoiceCount = contract.Invoices?.Count ?? 0,
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
            }).ToList();
        }

        public List<RentalContract> GetAffectedContracts(int vehicleId)
        {
            return _contractRepo.GetAll()
                .Where(v => v.VehicleId == vehicleId && v.Status == RentalStatus.Confirmed)
                .Where(c => c.StartTime > DateTime.UtcNow)
                .ToList();
        }

        public List<ContractReadDto> ViewAffectedContracts(int vehicleId)
        {
            var contracts = _contractRepo.GetAll()
                .Where(v => v.VehicleId == vehicleId && v.Status == RentalStatus.Confirmed)
                .Where(c => c.StartTime > DateTime.UtcNow)
                .ToList();

            return contracts.Select(contract => new ContractReadDto
            {
                ContractId = contract.ContractId,
                EVRenterId = contract.EVRenterId,
                EVRenterName = contract.EVRenter?.Account?.FullName,
                PhoneNumber = contract.EVRenter?.Account?.PhoneNumber,
                StaffId = contract.StaffId,
                StaffName = contract.Staff?.Account?.FullName,
                ModelName = contract.Vehicle?.Model?.Name,
                VehicleId = contract.VehicleId ?? 0,
                VehicleLicensePlate = contract.Vehicle?.LicensePlate,
                StationId = contract.StationId ?? 0,
                StationName = contract.Station?.Name,
                StartTime = contract.StartTime,
                EndTime = contract.EndTime,
                TotalCost = contract.TotalCost,
                Status = contract.Status,
                ImageIn = contract.ImageUrlIn,
                ImageOut = contract.ImageUrlOut,
                Notes = contract.Note,
            }).ToList();
        }

        public bool UpdateContract(RentalContract contract)
        {
            try
            {
                _contractRepo.Update(contract);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating contract {ContractId}", contract.ContractId);
                return false;
            }
        }
    }
}
