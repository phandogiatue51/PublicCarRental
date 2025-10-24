using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;

public class ContractModificationService : IContractModificationService
{
    private readonly IContractRepository _contractRepository;
    private readonly IVehicleService _vehicleService;
    private readonly IInvoiceService _invoiceService;

    public ContractModificationService(IContractRepository contractRepository, IVehicleService vehicleService,
        IInvoiceService invoiceService)
    {
        _contractRepository = contractRepository;
        _vehicleService = vehicleService;
        _invoiceService = invoiceService;
    }

    // ✅ SUB-FLOW 1: Renter wants to change model
    public async Task<ModificationResultDto> ChangeModelAsync(int contractId, ChangeModelRequest request)
    {
        var contract = _contractRepository.GetById(contractId);
        var originalInvoice = await _invoiceService.GetOriginalInvoiceAsync(contractId);

        // Find available vehicle of new model
        var newVehicle = await _vehicleService.GetFirstAvailableVehicleByModelAsync(
            request.NewModelId, (int)contract.StationId, contract.StartTime, contract.EndTime);

        if (newVehicle == null)
            return new ModificationResultDto { Success = false, Message = "No available vehicles for selected model" };

        // Calculate price difference
        var newTotal = CalculateNewTotal(newVehicle, contract.StartTime, contract.EndTime);
        var priceDifference = newTotal - originalInvoice.AmountDue;

        int? newInvoiceId = null;

        // Business Rule: Customer-initiated → charge more if higher, no refund if lower
        if (priceDifference > 0)
        {
            var newInvoice = await _invoiceService.CreateAdditionalInvoiceAsync(
                contractId, priceDifference, "Model upgrade charge");
            newInvoiceId = newInvoice.InvoiceId;
        }

        contract.VehicleId = newVehicle.VehicleId;
        contract.TotalCost = newTotal;
        _contractRepository.Update(contract);

        return new ModificationResultDto
        {
            Success = true,
            Message = priceDifference > 0 ?
                "Model changed. Additional payment required." :
                "Model changed successfully.",
            PriceDifference = priceDifference,
            NewInvoiceId = newInvoiceId,
            UpdatedContract = MapToContractDto(contract) 
        };
    }

    // ✅ SUB-FLOW 1: Lengthen time
    public async Task<ModificationResultDto> ExtendTimeAsync(int contractId, ExtendTimeRequest request)
    {
        var contract = _contractRepository.GetById(contractId);

        // Check if vehicle is available for extended period
        var isAvailable = await _vehicleService.CheckVehicleAvailabilityAsync(
            (int)contract.VehicleId, contract.EndTime, request.NewEndTime);

        if (!isAvailable)
            return new ModificationResultDto { Success = false, Message = "Vehicle not available for extended period" };

        // Calculate additional cost for extra time
        var additionalHours = (request.NewEndTime - contract.EndTime).TotalHours;
        var additionalCost = (decimal)additionalHours * contract.Vehicle.Model.PricePerHour;

        // Create additional invoice
        var newInvoice = await _invoiceService.CreateAdditionalInvoiceAsync(
            contractId, additionalCost, "Time extension charge");

        // Update contract end time and total cost
        contract.EndTime = request.NewEndTime;
        contract.TotalCost += additionalCost;
        _contractRepository.Update(contract);

        return new ModificationResultDto
        {
            Success = true,
            Message = $"Time extended to {request.NewEndTime}. Additional payment required.",
            PriceDifference = additionalCost,
            NewInvoiceId = newInvoice.InvoiceId,
            UpdatedContract = MapToContractDto(contract)
        };
    }

    // ✅ SUB-FLOW 2: Vehicle becomes unavailable (good scenarios only)
    public async Task<ModificationResultDto> ChangeVehicleAsync(int contractId, ChangeVehicleRequest request)
    {
        var contract = _contractRepository.GetById(contractId);
        var originalInvoice = await _invoiceService.GetOriginalInvoiceAsync(contractId);

        // Case 1: Staff specified vehicle
        if (request.NewVehicleId.HasValue)
        {
            var newVehicle = _vehicleService.GetEntityById(request.NewVehicleId.Value); // ✅ Use GetEntityById
            return await ProcessVehicleChange(contract, newVehicle, originalInvoice, request.Reason);
        }

        // Case 2: Auto-find best replacement
        var replacement = await FindBestReplacementVehicle(contract);
        return await ProcessVehicleChange(contract, replacement, originalInvoice, request.Reason);
    }

    private async Task<ModificationResultDto> ProcessVehicleChange(RentalContract contract, Vehicle newVehicle, Invoice originalInvoice, string reason)
    {
        decimal priceDifference = 0;

        var newTotal = CalculateNewTotal(newVehicle, contract.StartTime, contract.EndTime);
        priceDifference = newTotal - originalInvoice.AmountDue;

        // ✅ SIMPLIFIED: No refund logic for now
        // Update contract immediately
        contract.VehicleId = newVehicle.VehicleId;
        _contractRepository.Update(contract);

        return new ModificationResultDto
        {
            Success = true,
            Message = "Vehicle updated successfully.",
            PriceDifference = priceDifference,
            UpdatedContract = MapToContractDto(contract) 
        };
    }

    // ✅ Fixed helper methods
    private async Task<Vehicle> FindBestReplacementVehicle(RentalContract contract)
    {
        // Get current vehicle's model ID
        var currentVehicle = _vehicleService.GetEntityById((int)contract.VehicleId);
        var currentModelId = currentVehicle.ModelId;

        // Priority 1: Same model at same station
        var sameModelVehicle = await _vehicleService.GetFirstAvailableVehicleByModelAsync(
            currentModelId, (int)contract.StationId, contract.StartTime, contract.EndTime);

        if (sameModelVehicle != null) return sameModelVehicle;

        // Priority 2: Similar model at same station (use any available model for now)
        var availableVehicles = await _vehicleService.GetVehiclesByFiltersAsync(
            null, null, contract.StationId, null, null);

        var availableVehicle = availableVehicles.FirstOrDefault();
        if (availableVehicle != null)
        {
            return _vehicleService.GetEntityById(availableVehicle.VehicleId);
        }

        throw new InvalidOperationException("No suitable replacement vehicle found");
    }

    private decimal CalculateNewTotal(Vehicle vehicle, DateTime startTime, DateTime endTime)
    {
        var duration = (endTime - startTime).TotalHours;
        return (decimal)duration * vehicle.Model.PricePerHour;
    }
    private ContractDto MapToContractDto(RentalContract contract)
    {
        return new ContractDto
        {
            ContractId = contract.ContractId,
            EVRenterId = contract.EVRenterId,
            VehicleId = (int)contract.VehicleId,
            StationId = (int)contract.StationId,
            StartTime = contract.StartTime,
            EndTime = contract.EndTime,
            TotalCost = contract.TotalCost,
            Status = contract.Status,
            StaffId = contract.StaffId,
        };
    }
}

public interface IContractModificationService
{
    Task<ModificationResultDto> ChangeModelAsync(int contractId, ChangeModelRequest request);
    Task<ModificationResultDto> ExtendTimeAsync(int contractId, ExtendTimeRequest request);
    Task<ModificationResultDto> ChangeVehicleAsync(int contractId, ChangeVehicleRequest request);
}