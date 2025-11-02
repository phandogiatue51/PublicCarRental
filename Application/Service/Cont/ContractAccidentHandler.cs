using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Application.Service.Rabbit;

namespace PublicCarRental.Application.Service.Cont
{
    public class ContractAccidentHandler : IContractAccidentHandler
    {
        private readonly IVehicleService _vehicleService;
        private readonly IContractService _contractService;
        private readonly IAccidentRepository _accidentRepository;
        private readonly IServiceProvider _serviceProvider;
        public ContractAccidentHandler(IVehicleService vehicleService, IContractService contractService, 
            IAccidentRepository accidentRepository, IServiceProvider serviceProvider)
        {
            _vehicleService = vehicleService;
            _contractService = contractService;
            _serviceProvider = serviceProvider;
        }

        public async Task HandleAffectedContracts(int damagedVehicleId, string accidentReason)
        {
            var affectedContracts = _contractService.GetConfirmedContractByVehicle(damagedVehicleId);

            foreach (var contract in affectedContracts.Where(c => c.StartTime > DateTime.UtcNow))
            {
                await ProcessContractReplacement(contract, accidentReason);
            }
        }

        public async Task<AccidentProcessingResult> ProcessApprovedAccidentAsync(int accidentId, string approvalNotes)
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
                var result = await ProcessContractReplacement(contract,
                    $"Approved replacement: {accident.Description}", true);

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

            var sameModelVehicles = await _vehicleService.GetAvailableVehiclesByModelAsync(
                currentVehicle.ModelId, (int)contract.StationId, contract.StartTime, contract.EndTime, currentVehicle.VehicleId);

            options.AddRange(sameModelVehicles.Select(v => new VehicleOptionDto
            {
                Vehicle = MapToVehicleDto(v),
                OptionType = "SameModel",
                PriceDifference = 0
            }));

            var otherVehicles = await _vehicleService.GetAvailableVehiclesByModelAsync(currentVehicle.ModelId, (int)contract.StationId, contract.StartTime, contract.EndTime);

            options.AddRange(otherVehicles.Select(v => new VehicleOptionDto
            {
                Vehicle = MapToVehicleDto(v),
                OptionType = "DifferentModel",
                PriceDifference = v.Model.PricePerHour - currentVehicle.Model.PricePerHour
            }));

            return options.OrderBy(o => o.PriceDifference).ToList();
        }

        public async Task<ModificationResultDto> SelectReplacementVehicle(int contractId, int vehicleId, string reason)
        {
            try
            {
                var contract = _contractService.GetEntityById(contractId);
                var selectedVehicle = _vehicleService.GetEntityById(vehicleId);

                var availableOptions = await GetAvailableReplacementOptions(contractId);
                if (!availableOptions.Any(o => o.Vehicle.VehicleId == vehicleId))
                {
                    return new ModificationResultDto
                    {
                        Success = false,
                        Message = "Selected vehicle is not available for this contract period"
                    };
                }

                contract.VehicleId = vehicleId;
                _contractService.UpdateContract(contract);

                return new ModificationResultDto
                {
                    Success = true,
                    Message = $"Vehicle replaced successfully due to: {reason}"
                };
            }
            catch (Exception ex)
            {
                return new ModificationResultDto
                {
                    Success = false,
                    Message = $"Error replacing vehicle: {ex.Message}"
                };
            }
        }


        private async Task<ModificationResultDto> ProcessContractReplacement(RentalContract contract, string reason, bool isApproved = false, int? approvedBy = null)
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
                return await ProcessNoVehicleAvailable(contract, reason);
            }
        }

        private async Task<ModificationResultDto> ProcessNoVehicleAvailable(RentalContract contract, string reason)
        {
            return new ModificationResultDto
            {
                Success = false,
                Message = "No replacement vehicles available - requires staff follow-up"
            };
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

        public async Task<AccidentProcessingResult> RejectAutomaticReplacementAsync(int accidentId, string reason)
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

        public async Task<BulkReplacementResult> SmartBulkReplaceAsync(int accidentId)
        {
            var accident = _accidentRepository.GetAll()
                .FirstOrDefault(a => a.AccidentId == accidentId);
            if (accident == null)
                return new BulkReplacementResult { Success = false, Message = "Accident not found" };

            var remainingContracts = (await GetAffectedContractsAsync(accident.VehicleId))
                .Where(c => c.VehicleId == accident.VehicleId) // Only contracts that haven't been replaced yet
                .OrderBy(c => c.StartTime)
                .ToList();

            if (!remainingContracts.Any())
            {
                return new BulkReplacementResult
                {
                    Success = true,
                    Message = "All contracts have already been processed!",
                };
            }

            var availableVehicles = await GetAvailableReplacementPool(accident.VehicleId, remainingContracts);
            var results = new List<ContractReplacementResult>();

            foreach (var contract in remainingContracts)
            {
                var bestMatch = FindBestAvailableVehicle(availableVehicles, contract);
                if (bestMatch != null)
                {
                    var replacementResult = await ReplaceSingleContract(contract, bestMatch.Vehicle.VehicleId);
                    availableVehicles.Remove(bestMatch);
                    results.Add(new ContractReplacementResult
                    {
                        Success = true,
                        ContractId = contract.ContractId,
                        NewVehicleId = bestMatch.Vehicle.VehicleId,
                        Message = replacementResult.Message
                    });
                }
                else
                {
                    results.Add(new ContractReplacementResult
                    {
                        Success = false,
                        ContractId = contract.ContractId,
                        Reason = "No vehicle available",
                        Message = "Contract still has damaged vehicle - needs staff follow-up"
                    });
                }
            }

            return new BulkReplacementResult
            {
                Success = true,
                Message = $"Processed {results.Count(r => r.Success)} out of {remainingContracts.Count} remaining contracts",
                Results = results,
            };
        }

        private async Task<List<VehicleOptionDto>> GetAvailableReplacementPool(int damagedVehicleId, List<RentalContract> allContracts)
        {
            var allAvailableVehicles = new List<VehicleOptionDto>();

            foreach (var contract in allContracts)
            {
                var options = await GetAvailableReplacementOptions(contract.ContractId);
                // Filter out the damaged vehicle and already assigned vehicles
                var validOptions = options.Where(o => o.Vehicle.VehicleId != damagedVehicleId);
                allAvailableVehicles.AddRange(validOptions);
            }

            return allAvailableVehicles
                .GroupBy(v => v.Vehicle.VehicleId)
                .Select(g => g.First())
                .ToList();
        }

        private VehicleOptionDto FindBestAvailableVehicle(List<VehicleOptionDto> availableVehicles, RentalContract contract)
        {
            if (contract.Vehicle == null) return availableVehicles.FirstOrDefault();

            // Priority 1: Same model, same station
            var bestMatch = availableVehicles
                .FirstOrDefault(v => v.Vehicle.ModelId == contract.Vehicle.ModelId &&
                                    v.Vehicle.StationId == contract.StationId);

            if (bestMatch != null) return bestMatch;

            // Priority 2: Same model, different station  
            bestMatch = availableVehicles
                .FirstOrDefault(v => v.Vehicle.ModelId == contract.Vehicle.ModelId);

            if (bestMatch != null) return bestMatch;

            // Priority 3: Any available vehicle
            return availableVehicles.FirstOrDefault();
        }

        private async Task<ModificationResultDto> ReplaceSingleContract(RentalContract contract, int newVehicleId)
        {
            return await SelectReplacementVehicle(contract.ContractId, newVehicleId,
                "Bulk replacement from accident");
        }

        public async Task<ReplacementPreviewDto> GetReplacementPreviewAsync(int accidentId)
        {
            var accident = _accidentRepository.GetAll()
                .FirstOrDefault(a => a.AccidentId == accidentId);
            if (accident == null)
                return new ReplacementPreviewDto { Success = false, Message = "Accident not found" };

            var remainingContracts = (await GetAffectedContractsAsync(accident.VehicleId))
                .Where(c => c.VehicleId == accident.VehicleId)
                .OrderBy(c => c.StartTime)
                .ToList();

            var totalAffected = (await GetAffectedContractsAsync(accident.VehicleId)).Count;
            var alreadyProcessed = totalAffected - remainingContracts.Count;

            var availableVehiclesPool = await GetAvailableReplacementPool(accident.VehicleId, remainingContracts);
            var availableVehiclesCopy = availableVehiclesPool.ToList();
            var previewResults = new List<ContractReplacementPreview>();

            foreach (var contract in remainingContracts)
            {
                var bestMatch = FindBestAvailableVehicle(availableVehiclesCopy, contract);
                if (bestMatch != null)
                {
                    previewResults.Add(new ContractReplacementPreview
                    {
                        ContractId = contract.ContractId,
                        RenterName = contract.EVRenter?.Account.FullName ?? "Unknown",
                        StartTime = contract.StartTime,
                        CurrentVehicleId = (int)contract.VehicleId,
                        NewVehicleId = bestMatch.Vehicle.VehicleId,
                        NewVehicleInfo = $"{bestMatch.Vehicle.LicensePlate} - {bestMatch.Vehicle.ModelName}",
                        WillBeReplaced = true,
                        ReplacementType = bestMatch.OptionType
                    });
                    availableVehiclesCopy.Remove(bestMatch);
                }
                else
                {
                    previewResults.Add(new ContractReplacementPreview
                    {
                        ContractId = contract.ContractId,
                        RenterName = contract.EVRenter?.Account.FullName ?? "Unknown",
                        StartTime = contract.StartTime,
                        CurrentVehicleId = (int)contract.VehicleId,
                        WillBeReplaced = false,
                        Reason = "No available replacement vehicle"
                    });
                }
            }

            return new ReplacementPreviewDto
            {
                Success = true,
                AccidentId = accidentId,
                TotalContracts = totalAffected,
                CanBeReplaced = previewResults.Count(r => r.WillBeReplaced),
                CannotBeReplaced = previewResults.Count(r => !r.WillBeReplaced),
                PreviewResults = previewResults
            };
        }

    }
}