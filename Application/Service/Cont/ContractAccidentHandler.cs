using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Application.Service.Rabbit;

namespace PublicCarRental.Application.Service.Cont
{
    public interface IContractAccidentHandler
    {
        Task HandleAffectedContracts(int damagedVehicleId, int staffId, string accidentReason);
        Task<AccidentProcessingResult> ProcessApprovedAccidentAsync(int accidentId, int adminId, string approvalNotes);
        Task<List<VehicleOptionDto>> GetAvailableReplacementOptions(int contractId);
        Task<ModificationResultDto> SelectReplacementVehicle(int contractId, int vehicleId, int staffId, string reason);

        Task<AccidentProcessingResult> RejectAutomaticReplacementAsync(int accidentId, int adminId, string reason);
        Task<List<RentalContract>> GetAffectedContractsAsync(int vehicleId);
    }

    public class ContractAccidentHandler : IContractAccidentHandler
    {
        private readonly IVehicleService _vehicleService;
        private readonly IContractService _contractService;
        private readonly IContractModificationService _modificationService;
        private readonly IAccidentRepository _accidentRepository;
        private readonly IServiceProvider _serviceProvider;
        public ContractAccidentHandler(IVehicleService vehicleService, IContractService contractService, IContractModificationService contractModificationService,
            IAccidentRepository accidentRepository, IServiceProvider serviceProvider)
        {
            _vehicleService = vehicleService;
            _contractService = contractService;
            _modificationService = contractModificationService;
            _accidentRepository = accidentRepository;
            _serviceProvider = serviceProvider;
        }

        public async Task HandleAffectedContracts(int damagedVehicleId, int staffId, string accidentReason)
        {
            var affectedContracts = _contractService.GetConfirmedContractByVehicle(damagedVehicleId);

            foreach (var contract in affectedContracts.Where(c => c.StartTime > DateTime.UtcNow))
            {
                await ProcessContractReplacement(contract, staffId, accidentReason);
            }
        }

        public async Task<AccidentProcessingResult> ProcessApprovedAccidentAsync(int accidentId, int adminId, string approvalNotes)
        {
            var accident = _accidentRepository.GetAll()
                .FirstOrDefault(a => a.AccidentId == accidentId);
            if (accident == null)
                return new AccidentProcessingResult { Success = false, Message = "Accident report not found" };

            var affectedContracts = _contractService.GetConfirmedContractByVehicle(accident.VehicleId)
                .Where(c => c.StartTime > DateTime.UtcNow)
                .ToList();

            int processedCount = 0;
            var results = new List<ModificationResultDto>();

            foreach (var contract in affectedContracts)
            {
                var result = await ProcessContractReplacement(contract, accident.StaffId ?? adminId,
                    $"Approved replacement: {accident.Description}", true, adminId);

                if (result.Success) processedCount++;
                results.Add(result);
            }
            accident.Status = AccidentStatus.RepairApproved;
            _accidentRepository.UpdateAcc(accident);

            return new AccidentProcessingResult
            {
                Success = processedCount > 0,
                Message = $"Processed {processedCount} out of {affectedContracts.Count} affected contracts",
                AffectedContracts = processedCount,
                ProcessingResults = results
            };
        }

        public async Task<List<VehicleOptionDto>> GetAvailableReplacementOptions(int contractId)
        {
            var contract = _contractService.GetEntityById(contractId);
            var currentVehicle = _vehicleService.GetEntityById((int)contract.VehicleId);

            var options = new List<VehicleOptionDto>();

            // 1. Get same model vehicles (exclude current damaged vehicle)
            var sameModelVehicles = await _vehicleService.GetAvailableVehiclesByModelAsync(
                currentVehicle.ModelId, (int)contract.StationId, contract.StartTime, contract.EndTime, currentVehicle.VehicleId);

            options.AddRange(sameModelVehicles.Select(v => new VehicleOptionDto
            {
                Vehicle = MapToVehicleDto(v),
                OptionType = "SameModel",
                PriceDifference = 0
            }));

            // 2. Get other available vehicles at the same station
            var otherVehicles = await _vehicleService.GetAvailableVehiclesByModelAsync(currentVehicle.ModelId, (int)contract.StationId, contract.StartTime, contract.EndTime);

            options.AddRange(otherVehicles.Select(v => new VehicleOptionDto
            {
                Vehicle = MapToVehicleDto(v),
                OptionType = "DifferentModel",
                PriceDifference = v.Model.PricePerHour - currentVehicle.Model.PricePerHour
            }));

            return options.OrderBy(o => o.PriceDifference).ToList();
        }

        public async Task<ModificationResultDto> SelectReplacementVehicle(int contractId, int vehicleId, int staffId, string reason)
        {
            var contract = _contractService.GetEntityById(contractId);
            var selectedVehicle = _vehicleService.GetEntityById(vehicleId);

            var request = new StaffVehicleProblemRequest
            {
                ProblemType = VehicleProblemType.Accident,
                StaffId = staffId,
                Reason = reason,
                NewVehicleId = vehicleId,
                Note = "User-selected replacement",
                IsAutomaticReplacement = true
            };

            var result = await _modificationService.HandleStaffVehicleProblemAsync(contractId, request);

            return result;
        }

        private async Task<ModificationResultDto> ProcessContractReplacement(RentalContract contract, int staffId, string reason, bool isApproved = false, int? approvedBy = null)
        {
            var availableVehicles = await GetAvailableReplacementOptions(contract.ContractId);

            if (availableVehicles.Any())
            {
                return new ModificationResultDto
                {
                    Success = true,
                    Message = "Available vehicles found. Please select one.",
                    AvailableVehicles = availableVehicles,
                    RequiresUserSelection = true
                };
            }
            else
            {
                return await ProcessNoVehicleAvailable(contract, staffId, reason);
            }
        }

        private async Task<ModificationResultDto> ProcessNoVehicleAvailable(RentalContract contract, int staffId, string reason)
        {
            var request = new StaffVehicleProblemRequest
            {
                ProblemType = VehicleProblemType.Unavailable,
                StaffId = staffId,
                Reason = reason,
                Note = "Full refund due to no available vehicles"
            };

            var result = await _modificationService.HandleStaffVehicleProblemAsync(contract.ContractId, request);

            return result;
        }

        private VehicleDto MapToVehicleDto(Vehicle vehicle)
        {
            return new VehicleDto
            {
                VehicleId = vehicle.VehicleId,
                LicensePlate = vehicle.LicensePlate,
                BatteryLevel = vehicle.BatteryLevel,
                Status = vehicle.Status,
                StationId = vehicle.StationId,
                StationName = vehicle.Station?.Name,
                ModelId = vehicle.ModelId,
                ModelName = vehicle.Model?.Name,
            };
        }

        public async Task<AccidentProcessingResult> RejectAutomaticReplacementAsync(int accidentId, int adminId, string reason)
        {
            var accident = _accidentRepository.GetAll()
                .FirstOrDefault(a => a.AccidentId == accidentId);
            if (accident == null)
                return new AccidentProcessingResult { Success = false, Message = "Accident report not found" };

            accident.Status = AccidentStatus.UnderInvestigation;
            _accidentRepository.UpdateAcc(accident);

            return new AccidentProcessingResult
            {
                Success = true,
                Message = $"Automatic replacement rejected. Accident #{accidentId} requires manual handling.",
                AffectedContracts = 0
            };
        }

        public async Task<List<RentalContract>> GetAffectedContractsAsync(int vehicleId)
        {
            var contracts = _contractService.GetConfirmedContractByVehicle(vehicleId)
                .Where(c => c.StartTime > DateTime.UtcNow)
                .ToList();

            return contracts;
        }
    }
}