using Microsoft.Extensions.Caching.Distributed;
using PublicCarRental.Application.DTOs;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.Service.Mod;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Application.Service.Ren;
using PublicCarRental.Application.Service.Stat;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Inv;
using System.Text.Json;

public interface IBookingService
{
    Task<(bool Success, string Message, int InvoiceId, string BookingToken)> CreateBookingRequestAsync(CreateContractDto dto);
    Task<BookingRequest?> GetBookingRequest(string bookingToken);
    Task RemoveBookingRequest(string bookingToken);
    Task<BookingSummaryDto?> GetBookingSummaryAsync(string bookingToken);
}

public class BookingService : IBookingService
{
    private readonly IDistributedCache _distributedCache;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IVehicleService _vehicleService;
    private readonly IDistributedLockService _distributedLock;
    private readonly ILogger<BookingService> _logger;
    private readonly IStationService _stationService;
    private readonly IEVRenterService _renterService;
    private readonly IModelService _modelService;

    public BookingService(
        IDistributedCache distributedCache,
        IInvoiceRepository invoiceRepository,
        IVehicleService vehicleService,
        IDistributedLockService distributedLock,
        ILogger<BookingService> logger,
        IStationService stationService,
        IEVRenterService renterService,
        IModelService modelService)
    {
        _distributedCache = distributedCache;
        _invoiceRepository = invoiceRepository;
        _vehicleService = vehicleService;
        _distributedLock = distributedLock;
        _logger = logger;
        _stationService = stationService;
        _renterService = renterService;
        _modelService = modelService;
    }

    public async Task<(bool Success, string Message, int InvoiceId, string BookingToken)> CreateBookingRequestAsync(CreateContractDto dto)
    {
        var vehicle = await _vehicleService.GetFirstAvailableVehicleByModelAsync(dto.ModelId, dto.StationId, dto.StartTime, dto.EndTime);
        if (vehicle == null)
            return (false, "Model not available. Choose another time, station, or model.", 0, "");

        var lockKey = $"vehicle_booking:{vehicle.VehicleId}:{dto.StartTime:yyyyMMddHHmm}_{dto.EndTime:yyyyMMddHHmm}";
        var bookingToken = Guid.NewGuid().ToString();

        try
        {
            if (!_distributedLock.AcquireLock(lockKey, bookingToken, TimeSpan.FromMinutes(15)))
                return (false, "Please try again. Someone is booking this vehicle.", 0, "");

            var isStillAvailable = await _vehicleService.CheckVehicleAvailabilityAsync(vehicle.VehicleId, dto.StartTime, dto.EndTime);
            if (!isStillAvailable)
            {
                _distributedLock.ReleaseLock(lockKey, bookingToken); 
                return (false, "Vehicle no longer available.", 0, "");
            }

            var duration = (dto.EndTime - dto.StartTime).TotalHours;
            var totalCost = (decimal)duration * vehicle.Model.PricePerHour;

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

            await SaveBookingRequestAsync(bookingRequest);

            _ = Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromMinutes(10));
                await _distributedCache.RemoveAsync($"booking:{bookingToken}");
            });

            return (true, "Booking request created successfully!", invoice.InvoiceId, bookingToken);
        }
        catch (Exception ex)
        {
            _distributedLock.ReleaseLock(lockKey, bookingToken); 
            _logger.LogError(ex, "Error creating booking request");
            throw;
        }
    }

    public async Task<BookingRequest?> GetBookingRequest(string bookingToken)
    {
        try
        {
            var cachedData = await _distributedCache.GetStringAsync($"booking:{bookingToken}");
            if (cachedData == null) return null;

            return JsonSerializer.Deserialize<BookingRequest>(cachedData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting booking request for token {BookingToken}", bookingToken);
            return null;
        }
    }

    public async Task RemoveBookingRequest(string bookingToken)
    {
        _ = _distributedCache.RemoveAsync($"booking:{bookingToken}");
    }

    public async Task<BookingSummaryDto?> GetBookingSummaryAsync(string bookingToken)
    {
        var bookingRequest = await GetBookingRequest(bookingToken);
        if (bookingRequest == null) return null;

        try
        {
            var model = await _modelService.GetByIdAsync(bookingRequest.ModelId);
            var station = await _stationService.GetByIdAsync(bookingRequest.StationId);
            var renter = await _renterService.GetEntityByIdAsync(bookingRequest.EVRenterId);

            return new BookingSummaryDto
            {
                BookingToken = bookingRequest.BookingToken,
                ModelName = model?.Name ?? "Unknown Model",
                StationName = station?.Name ?? "Unknown Station",
                RenterName = renter?.Account?.FullName ?? "Unknown Renter",
                StartTime = bookingRequest.StartTime,
                EndTime = bookingRequest.EndTime,
                TotalCost = bookingRequest.TotalCost,
                Terms = new[] {
                    "The renter is responsible for the vehicle during the rental period.",
                    "Any damages must be reported immediately.",
                    "Late returns will incur additional charges.",
                    "Electricity is the responsibility of the renter.",
                    "Charging costs are not included in the rental price.",
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

    private async Task SaveBookingRequestAsync(BookingRequest request)
    {
        try
        {
            var data = JsonSerializer.Serialize(request);
            await _distributedCache.SetStringAsync(
                $"booking:{request.BookingToken}",
                data,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpiration = request.ExpiresAt
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving booking request to cache");
            throw;
        }
    }
}