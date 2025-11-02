using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.DTOs.Refund;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Application.Service;
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

    public ContractModificationService(IContractRepository contractRepository, IVehicleService vehicleService,
        IInvoiceService invoiceService, IRefundService refundService)
    {
        _contractRepository = contractRepository;
        _vehicleService = vehicleService;
        _invoiceService = invoiceService;
        _refundService = refundService;
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

    public async Task<ModificationResultDto> HandleRenterCancellation(int contractId, RenterChangeRequest request)
    {
        var contract = _contractRepository.GetById(contractId);
        var totalPaid = contract.TotalCost;
        {
            var daysUntilStart = (contract.StartTime - DateTime.UtcNow).TotalDays;
            decimal refundAmount = 0;

            if (daysUntilStart > 5)
            {
                refundAmount = (decimal)(totalPaid * 0.8m);
            }

            if (refundAmount > 0)
            {
                var refundRequest = new CreateRefundRequestDto
                {
                    ContractId = contract.ContractId,
                    Amount = refundAmount,
                    Reason = $"Contract cancellation: {request.Reason}",
                    StaffId = request.StaffId,
                    Note = $"Cancelled {daysUntilStart:F0} days before start"
                };

                var refundResult = await _refundService.RequestRefundAsync(refundRequest);

                contract.Status = RentalStatus.Cancelled;
                _contractRepository.Update(contract);

                return new ModificationResultDto
                {
                    Success = refundResult.Success,
                    Message = refundResult.Success ?
                        $"Contract cancelled. {refundAmount:C} refund processed." :
                        "Contract cancelled but refund failed.",
                    PriceDifference = -refundAmount,
                    RefundId = refundResult.RefundId,
                    UpdatedContract = MapToContractDto(contract)
                };
            }
            else
            {
                contract.Status = RentalStatus.Cancelled;
                _contractRepository.Update(contract);

                return new ModificationResultDto
                {
                    Success = true,
                    Message = "Contract cancelled. No refund applicable.",
                    PriceDifference = 0,
                    UpdatedContract = MapToContractDto(contract)
                };
            }
        }
    }
}

public interface IContractModificationService
{
    Task<ModificationResultDto> ChangeModelAsync(int contractId, RenterChangeRequest request);
    Task<ModificationResultDto> ExtendTimeAsync(int contractId, RenterChangeRequest request);
    Task<ModificationResultDto> ChangeVehicleAsync(int contractId, RenterChangeRequest request);
    Task<ModificationResultDto> HandleRenterCancellation(int contractId, RenterChangeRequest request);
}