using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Cont;
using PublicCarRental.Application.DTOs.Pay;
using PublicCarRental.Application.DTOs.Refund;
using PublicCarRental.Application.Service;
using PublicCarRental.Application.Service.Inv;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Inv;

public class ContractModificationService : IContractModificationService
{
    private readonly IContractRepository _contractRepository;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IVehicleService _vehicleService;
    private readonly IInvoiceService _invoiceService;
    private readonly IRefundService _refundService;
    private readonly ILogger<ContractModificationService> _logger;
    private readonly IPendingChangeService _pendingChangeService;

    public ContractModificationService(IContractRepository contractRepository, IVehicleService vehicleService,
        IInvoiceService invoiceService, IRefundService refundService, ILogger<ContractModificationService> logger,
        IPendingChangeService pendingChangeService, IInvoiceRepository invoiceRepository)
    {
        _contractRepository = contractRepository;
        _vehicleService = vehicleService;
        _invoiceService = invoiceService;
        _refundService = refundService;
        _logger = logger;
        _pendingChangeService = pendingChangeService;
        _invoiceRepository = invoiceRepository;
    }

    public async Task<ModificationResultDto> ChangeModelAsync(int contractId, RenterChangeRequest request)
    {
        var contract = _contractRepository.GetById(contractId);

        var originalInvoice = await _invoiceService.GetOriginalInvoiceAsync(contractId);
        if (originalInvoice?.Status != InvoiceStatus.Paid)
        {
            return new ModificationResultDto { Success = false, Message = "Please complete initial payment first" };
        }

        var newVehicle = await _vehicleService.GetFirstAvailableVehicleByModelAsync(
            (int)request.NewModelId, (int)contract.StationId, contract.StartTime, contract.EndTime);

        if (newVehicle == null)
            return new ModificationResultDto { Success = false, Message = "No available vehicles for selected model" };

        var newTotal = CalculateNewTotal(newVehicle, contract.StartTime, contract.EndTime);
        var totalPaid = await _invoiceService.GetTotalPaidAmountAsync(contractId);
        var priceDifference = newTotal - totalPaid;
        const decimal tolerance = 0.01m;
        Console.WriteLine($"💰 Price Debug: NewTotal={newTotal}, TotalPaid={totalPaid}, Difference={priceDifference}, Tolerance={tolerance}");
        Invoice newInvoice = null;
        PendingModificationDto pendingChange = null;

        if (priceDifference > tolerance) 
        {
            newInvoice = await _invoiceService.CreateAdditionalInvoiceAsync(
                contractId, priceDifference, "Model upgrade charge");

            pendingChange = new PendingModificationDto
            {
                ContractId = contractId,
                ChangeType = "ModelChange",
                NewVehicleId = newVehicle.VehicleId,
                NewTotalCost = newTotal,
                InvoiceId = newInvoice.InvoiceId
            };
            await _pendingChangeService.AddAsync(pendingChange);
        }
        else
        {
            contract.VehicleId = newVehicle.VehicleId;
            contract.TotalCost = newTotal;
            _contractRepository.Update(contract);
        }

        return new ModificationResultDto
        {
            Success = true,
            Message = priceDifference > tolerance
                ? "Additional payment required to complete model change"
                : "Model changed successfully",
            PriceDifference = priceDifference,
            NewInvoiceId = newInvoice?.InvoiceId, 
            RequiresPayment = priceDifference > tolerance, 
            UpdatedContract = MapToContractDto(contract)
        };
    }

    public async Task<ModificationResultDto> CompleteChangeAfterPaymentAsync(int invoiceId)
    {
        var invoice = _invoiceService.GetEntityById(invoiceId);
        if (invoice?.Status != InvoiceStatus.Paid)
        {
            return new ModificationResultDto { Success = false, Message = "Invoice not paid" };
        }

        // Get pending modification
        var pendingChange = await _pendingChangeService.GetByInvoiceIdAsync(invoiceId);
        if (pendingChange == null)
            return new ModificationResultDto { Success = false, Message = "No pending change found" };

        // Apply the contract changes
        var contract = _contractRepository.GetById(pendingChange.ContractId);

        if (pendingChange.ChangeType == "ModelChange")
        {
            contract.VehicleId = pendingChange.NewVehicleId;
            contract.TotalCost = pendingChange.NewTotalCost;
        }
        else if (pendingChange.ChangeType == "TimeExtension")
        {
            contract.EndTime = (DateTime)pendingChange.NewEndTime;
            contract.TotalCost = pendingChange.NewTotalCost;
        }

        _contractRepository.Update(contract);

        // Clean up
        await _pendingChangeService.RemoveAsync(invoiceId);

        return new ModificationResultDto
        {
            Success = true,
            Message = $"{pendingChange.ChangeType} completed successfully",
            UpdatedContract = MapToContractDto(contract)
        };
    }

    public async Task<ModificationResultDto> ExtendTimeAsync(int contractId, RenterChangeRequest request)
    {
        var contract = _contractRepository.GetById(contractId);

        // Check original payment
        var originalInvoice = await _invoiceService.GetOriginalInvoiceAsync(contractId);
        if (originalInvoice?.Status != InvoiceStatus.Paid)
        {
            return new ModificationResultDto { Success = false, Message = "Please complete initial payment first" };
        }

        var isAvailable = await _vehicleService.CheckVehicleAvailabilityAsync(
            (int)contract.VehicleId, contract.EndTime, (DateTime)request.NewEndTime);

        if (!isAvailable)
            return new ModificationResultDto { Success = false, Message = "Vehicle not available for extended period" };

        var timeDifference = (TimeSpan)(request.NewEndTime.Value - contract.EndTime);
        var additionalHours = timeDifference.TotalHours;
        var additionalCost = (decimal)additionalHours * contract.Vehicle.Model.PricePerHour;

        // Create invoice but don't update contract yet
        var newInvoice = await _invoiceService.CreateAdditionalInvoiceAsync(
            contractId, additionalCost, "Time extension charge");

        // Store pending modification
        var pendingChange = new PendingModificationDto
        {
            ContractId = contractId,
            ChangeType = "TimeExtension",
            NewEndTime = request.NewEndTime,
            NewTotalCost = (decimal)(contract.TotalCost + additionalCost),
            InvoiceId = newInvoice.InvoiceId
        };
        await _pendingChangeService.AddAsync(pendingChange);

        return new ModificationResultDto
        {
            Success = true,
            Message = $"Additional payment required to extend time to {request.NewEndTime}",
            PriceDifference = additionalCost,
            NewInvoiceId = newInvoice.InvoiceId,
            RequiresPayment = true,
            UpdatedContract = MapToContractDto(contract) 
        };
    }

    public async Task<ModificationResultDto> ChangeVehicleAsync(int contractId, RenterChangeRequest request)
    {
        if (!request.NewVehicleId.HasValue)
        {
            return new ModificationResultDto { Success = false, Message = "No vehicle selected" };
        }

        var contract = _contractRepository.GetById(contractId);
        var originalInvoice = await _invoiceService.GetOriginalInvoiceAsync(contractId);
        var newVehicle = _vehicleService.GetEntityById(request.NewVehicleId.Value);

        if (newVehicle == null)
            return new ModificationResultDto { Success = false, Message = "Selected vehicle not found" };

        if (newVehicle.StationId != contract.StationId)
            return new ModificationResultDto { Success = false, Message = "Vehicle not at the same station" };

        bool isAvailable = await _vehicleService.CheckVehicleAvailabilityAsync(
            newVehicle.VehicleId, contract.StartTime, contract.EndTime);

        if (!isAvailable)
            return new ModificationResultDto { Success = false, Message = "Vehicle is not available for the selected period" };

        return await ProcessVehicleChange(contract, newVehicle, originalInvoice, request.Reason);
    }

    private async Task<ModificationResultDto> ProcessVehicleChange(RentalContract contract, Vehicle newVehicle, Invoice originalInvoice, string reason)
    {
        decimal priceDifference = 0;

        var newTotal = CalculateNewTotal(newVehicle, contract.StartTime, contract.EndTime);
        priceDifference = newTotal - originalInvoice.AmountDue;

        contract.VehicleId = newVehicle.VehicleId;
        contract.TotalCost = newTotal;
        _contractRepository.Update(contract);

        return new ModificationResultDto
        {
            Success = true,
            Message = "Vehicle updated successfully.",
            PriceDifference = priceDifference,
            UpdatedContract = MapToContractDto(contract)
        };
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

        var pendingInvoice = contract.Invoices?.FirstOrDefault(i =>
            i.Status == InvoiceStatus.Pending);

        if (pendingInvoice != null)
        {
            return new ModificationResultDto
            {
                Success = false,
                Message = "Payment is still being processed. Please wait a moment and try again.",
                UpdatedContract = MapToContractDto(contract)
            };
        }

        var hasPaidInvoice = contract.Invoices?.Any(i =>
            i.Status == InvoiceStatus.Paid && i.AmountPaid > 0) ?? false;

        if (!hasPaidInvoice)
        {
 
            contract.Status = RentalStatus.Cancelled;
            _contractRepository.Update(contract);

            return new ModificationResultDto
            {
                Success = true,
                Message = "Contract cancelled. No payment was made.",
                PriceDifference = 0,
                UpdatedContract = MapToContractDto(contract)
            };
        }

        var totalPaid = contract.TotalCost ?? 0;
        var daysUntilStart = (contract.StartTime - DateTime.UtcNow).TotalDays;

        decimal refundAmount = 0;
        string policy;

        if (daysUntilStart >= 2)
        {
            refundAmount = totalPaid; // 100% refund
            policy = "100% refund (more than 2 days before start)";
        }
        else if (daysUntilStart >= 0)
        {
            refundAmount = totalPaid * 0.8m; // 80% refund
            policy = "80% refund (less than 2 days before start)";
        }
        else
        {
            refundAmount = 0; // No refund
            policy = "No refund (after rental start time)";
        }

        var refundRequest = new CreateRefundRequestDto
        {
            ContractId = contract.ContractId,
            Amount = refundAmount,
            Reason = $"Contract cancellation - {policy}",
            Note = $"Cancelled {daysUntilStart:F1} days before start. {policy}"
        };

        var refundResult = await _refundService.RequestRefundAsync(refundRequest);

        if (contract.Invoices != null)
        {
            foreach (var invoice in contract.Invoices)
            {
                if (invoice.Status == InvoiceStatus.Paid)
                {
                    if (refundResult.Success && refundAmount > 0)
                    {
                        invoice.Status = InvoiceStatus.Refunded;
                    }
                    else
                    {
                        invoice.Status = InvoiceStatus.Cancelled;
                    }
                }
                else if (invoice.Status == InvoiceStatus.Pending)
                {
                    invoice.Status = InvoiceStatus.Cancelled;
                }

                invoice.RefundedAt = DateTime.UtcNow;
                _invoiceRepository.Update(invoice);
            }
        }

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