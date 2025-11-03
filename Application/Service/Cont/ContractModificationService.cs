using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.DTOs.Pay;
using PublicCarRental.Application.DTOs.Refund;
using PublicCarRental.Application.Service;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;

public class ContractModificationService : IContractModificationService
{
    private readonly IContractRepository _contractRepository;
    private readonly IVehicleService _vehicleService;
    private readonly IInvoiceService _invoiceService;
    private readonly IRefundService _refundService;
    private readonly ILogger<ContractModificationService> _logger;

    public ContractModificationService(IContractRepository contractRepository, IVehicleService vehicleService,
        IInvoiceService invoiceService, IRefundService refundService, ILogger<ContractModificationService> logger)
    {
        _contractRepository = contractRepository;
        _vehicleService = vehicleService;
        _invoiceService = invoiceService;
        _refundService = refundService;
        _logger = logger;
    }

    public async Task<ModificationResultDto> ChangeModelAsync(int contractId, RenterChangeRequest request)
    {
        var contract = _contractRepository.GetById(contractId);
        var totalPaid = await _invoiceService.GetTotalPaidAmountAsync(contractId);

        var newVehicle = await _vehicleService.GetFirstAvailableVehicleByModelAsync(
            (int)request.NewModelId, (int)contract.StationId, contract.StartTime, contract.EndTime);

        if (newVehicle == null)
            return new ModificationResultDto { Success = false, Message = "No available vehicles for selected model" };

        var newTotal = CalculateNewTotal(newVehicle, contract.StartTime, contract.EndTime);

        var priceDifference = newTotal - totalPaid;
        const decimal tolerance = 0.01m;

        int? newInvoiceId = null;

        if (priceDifference > tolerance)
        {
            var newInvoice = await _invoiceService.CreateAdditionalInvoiceAsync(
                contractId, priceDifference, "Model upgrade charge");
            newInvoiceId = newInvoice.InvoiceId;
        }

        contract.VehicleId = newVehicle.VehicleId;
        contract.TotalCost = newTotal;
        _contractRepository.Update(contract);

        string message;
        if (Math.Abs(priceDifference) <= tolerance)
        {
            message = "Model changed successfully. No price change.";
            priceDifference = 0;
        }
        else if (priceDifference > tolerance)
        {
            message = "Model changed. Additional payment required.";
        }
        else
        {
            message = "Model changed successfully. Price difference absorbed.";
        }

        return new ModificationResultDto
        {
            Success = true,
            Message = message,
            PriceDifference = priceDifference,
            NewInvoiceId = newInvoiceId,
            UpdatedContract = MapToContractDto(contract)
        };
    }

    public async Task<ModificationResultDto> ExtendTimeAsync(int contractId, RenterChangeRequest request)
    {
        var contract = _contractRepository.GetById(contractId);

        var isAvailable = await _vehicleService.CheckVehicleAvailabilityAsync(
            (int)contract.VehicleId, contract.EndTime, (DateTime)request.NewEndTime);

        if (!isAvailable)
            return new ModificationResultDto { Success = false, Message = "Vehicle not available for extended period" };

        var timeDifference = (TimeSpan)(request.NewEndTime.Value - contract.EndTime);
        var additionalHours = timeDifference.TotalHours;
        var additionalCost = (decimal)additionalHours * contract.Vehicle.Model.PricePerHour;

        var newInvoice = await _invoiceService.CreateAdditionalInvoiceAsync(
            contractId, additionalCost, "Time extension charge");

        contract.EndTime = (DateTime)request.NewEndTime;
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

    public async Task<ModificationResultDto> ChangeVehicleAsync(int contractId, RenterChangeRequest request)
    {
        var contract = _contractRepository.GetById(contractId);
        var originalInvoice = await _invoiceService.GetOriginalInvoiceAsync(contractId);

        if (request.NewVehicleId.HasValue)
        {
            var newVehicle = _vehicleService.GetEntityById(request.NewVehicleId.Value);
            return await ProcessVehicleChange(contract, newVehicle, originalInvoice, request.Reason);
        }

        var replacement = await FindBestReplacementVehicle(contract);
        return await ProcessVehicleChange(contract, replacement, originalInvoice, request.Reason);
    }

    private async Task<ModificationResultDto> ProcessVehicleChange(RentalContract contract, Vehicle newVehicle, Invoice originalInvoice, string reason)
    {
        decimal priceDifference = 0;

        var newTotal = CalculateNewTotal(newVehicle, contract.StartTime, contract.EndTime);
        priceDifference = newTotal - originalInvoice.AmountDue;

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

    private async Task<Vehicle> FindBestReplacementVehicle(RentalContract contract)
    {
        var currentVehicle = _vehicleService.GetEntityById((int)contract.VehicleId);
        if (currentVehicle == null)
            throw new InvalidOperationException("Current vehicle not found");

        var currentModelId = currentVehicle.ModelId;

        var sameModelVehicle = await _vehicleService.GetFirstAvailableVehicleByModelAsync(
            currentModelId, (int)contract.StationId, contract.StartTime, contract.EndTime);

        if (sameModelVehicle != null) return sameModelVehicle;

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

    public async Task<ModificationResultDto> HandleRenterCancellation(int contractId, BankAccountInfo bankInfo)
    {
        var contract = _contractRepository.GetById(contractId);
        if (contract == null)
            throw new Exception("Contract not found.");

        var totalPaid = contract.TotalCost;
        var daysUntilStart = (contract.StartTime - DateTime.UtcNow).TotalDays;

        var refundAmount = (decimal)totalPaid;

        if (daysUntilStart < 2)
            refundAmount = (decimal)(totalPaid * 0.8m);

        var refundRequest = new CreateRefundRequestDto
        {
            ContractId = contract.ContractId,
            Amount = refundAmount,
            Reason = $"Contract cancellation",
            Note = $"Cancelled {daysUntilStart:F0} days before start"
        };

        var refundResult = await _refundService.RequestRefundAsync(refundRequest);

        if (refundResult.Success && refundResult.RefundId != null)
        {
            var processResult = await _refundService.ProcessRefundAsync(refundResult.RefundId, bankInfo);

            if (!processResult.Success)
            {
                _logger.LogInformation($"⚠️ Refund #{refundResult.RefundId} created but payout failed: {processResult.Message}");
            }
        }
        else
        {
            _logger.LogInformation($"⚠️ Refund creation failed: {refundResult.Message}");
        }

        contract.Status = RentalStatus.Cancelled;
        _contractRepository.Update(contract);

        return new ModificationResultDto
        {
            Success = refundResult.Success,
            Message = refundResult.Success
                ? $"Contract cancelled. {refundAmount:C} refund initiated."
                : "Contract cancelled but refund request failed.",
            PriceDifference = -refundAmount,
            RefundId = refundResult.RefundId,
            UpdatedContract = MapToContractDto(contract)
        };
    }
}

public interface IContractModificationService
{
    Task<ModificationResultDto> ChangeModelAsync(int contractId, RenterChangeRequest request);
    Task<ModificationResultDto> ExtendTimeAsync(int contractId, RenterChangeRequest request);
    Task<ModificationResultDto> ChangeVehicleAsync(int contractId, RenterChangeRequest request);
    Task<ModificationResultDto> HandleRenterCancellation(int contractId, BankAccountInfo bankInfo);
}