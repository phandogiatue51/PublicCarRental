using PublicCarRental.Application.DTOs;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Mod;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Application.Service.Ren;
using PublicCarRental.Application.Service.Stat;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Inv;
using System.Collections.Concurrent;

public interface IBookingService
{
    Task<(bool Success, string Message, int InvoiceId, string BookingToken)> CreateBookingRequestAsync(CreateContractDto dto);
    public BookingRequest? GetBookingRequest(string bookingToken);
    public void RemoveBookingRequest(string bookingToken);
    Task<BookingSummaryDto?> GetBookingSummaryAsync(string bookingToken);

}

public class BookingService : IBookingService
{
    private readonly ConcurrentDictionary<string, BookingRequest> _bookingRequests = new();
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IVehicleService _vehicleService;
    private readonly IDistributedLockService _distributedLock;
    private readonly ILogger<BookingService> _logger;
    private readonly IStationService _stationService; 
    private readonly IEVRenterService _renterService; 
    private readonly IModelService _modelService; 

    public BookingService(IInvoiceRepository invoiceRepository, IVehicleService vehicleService,
        IDistributedLockService distributedLock, ILogger<BookingService> logger, IStationService stationService,   
        IEVRenterService renterService, IModelService modelService)
    {
        _invoiceRepository = invoiceRepository;
        _vehicleService = vehicleService;
        _distributedLock = distributedLock;
        _logger = logger;
    }

    public async Task<(bool Success, string Message, int InvoiceId, string BookingToken)> CreateBookingRequestAsync(CreateContractDto dto)
    {
        var vehicle = await _vehicleService.GetFirstAvailableVehicleByModelAsync(dto.ModelId, dto.StationId, dto.StartTime, dto.EndTime);
        if (vehicle == null)
            return (false, "Model not available. Choose another time, station, or model.", 0, "");

        var lockKey = $"vehicle_booking:{vehicle.VehicleId}:{dto.StartTime:yyyyMMddHHmm}"; // Lock specific vehicle

        try
        {
            if (!_distributedLock.AcquireLock(lockKey, TimeSpan.FromSeconds(5)))
                return (false, "Please try again. Someone is booking this vehicle.", 0, "");

            var duration = (dto.EndTime - dto.StartTime).TotalHours;
            var totalCost = (decimal)duration * vehicle.Model.PricePerHour;

            var bookingToken = Guid.NewGuid().ToString();
            var invoice = new Invoice
            {
                AmountDue = totalCost,
                IssuedAt = DateTime.UtcNow,
                Status = InvoiceStatus.Pending,
                BookingToken = bookingToken
            };

            _invoiceRepository.Create(invoice);

            var bookingRequest = new BookingRequest
            {
                BookingToken = bookingToken,
                EVRenterId = dto.EVRenterId,
                ModelId = dto.ModelId,
                StationId = dto.StationId,
                VehicleId = vehicle.VehicleId, 
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                TotalCost = totalCost,
                InvoiceId = invoice.InvoiceId,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };

            _bookingRequests[bookingToken] = bookingRequest;

            _ = Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromMinutes(10));
                _bookingRequests.TryRemove(bookingToken, out _);
                _distributedLock.ReleaseLock(lockKey); 
            });

            return (true, "Please proceed to payment", invoice.InvoiceId, bookingToken);
        }
        catch (Exception)
        {
            _distributedLock.ReleaseLock(lockKey);
            throw;
        }
    }

    public BookingRequest? GetBookingRequest(string bookingToken)
    {
        _bookingRequests.TryGetValue(bookingToken, out var booking);
        return booking;
    }

    public void RemoveBookingRequest(string bookingToken)
    {
        _bookingRequests.TryRemove(bookingToken, out _);
    }

    public async Task<BookingSummaryDto?> GetBookingSummaryAsync(string bookingToken)
    {
        var bookingRequest = GetBookingRequest(bookingToken);
        if (bookingRequest == null)
            return null;

        try
        {
            var model =  _modelService.GetEntityById(bookingRequest.ModelId);
            var station =  _stationService.GetEntityById(bookingRequest.StationId);
            var renter = await _renterService.GetEntityByIdAsync(bookingRequest.EVRenterId);

            return new BookingSummaryDto
            {
                BookingToken = bookingRequest.BookingToken,
                ModelName = model?.Name ?? "Unknown Model",
                StationName = station?.Name ?? "Unknown Station",
                RenterName = renter.Account.FullName ?? "Unknown Renter",
                StartTime = bookingRequest.StartTime,
                EndTime = bookingRequest.EndTime,
                TotalCost = bookingRequest.TotalCost,
                Terms = new[] {
                    "The renter is responsible for the vehicle during the rental period.",
                    "Any damages must be reported immediately.",
                    "Late returns will incur additional charges.",
                    "Electricity is the responsibility of the renter.",
                    "Fuel/charging costs are not included in the rental price.",
                    "The vehicle must be returned to the same station."
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting booking summary for token {BookingToken}", bookingToken);
            return null;
        }
    }

}