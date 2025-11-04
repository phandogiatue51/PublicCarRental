using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Rabbit;
using PublicCarRental.Application.Service.Redis;
using PublicCarRental.Application.Service.Veh;
using PublicCarRental.Infrastructure.Data.Models;

namespace PublicCarRental.Application.Service.Cont
{
    public class ContractAccidentHandler : IContractAccidentHandler
    {
        private readonly IVehicleService _vehicleService;
        private readonly IContractService _contractService;
        private readonly IAccidentRepository _accidentRepository;
        private readonly IServiceProvider _serviceProvider;
        private readonly IDistributedLockService _distributedLock;
        private readonly ILogger<ContractAccidentHandler> _logger;
        public ContractAccidentHandler(IVehicleService vehicleService, IContractService contractService,
            IAccidentRepository accidentRepository, IServiceProvider serviceProvider, IDistributedLockService distributedLock,
            ILogger<ContractAccidentHandler> logger)
        {
            _vehicleService = vehicleService;
            _contractService = contractService;
            _serviceProvider = serviceProvider;
            _accidentRepository = accidentRepository;
            _distributedLock = distributedLock;
            _logger = logger;
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
                OptionType = "Same Model",
                PriceDifference = 0
            }));

            return options.OrderBy(o => o.PriceDifference).ToList();
        }

        public async Task<ModificationResultDto> SelectReplacementVehicle(int contractId, int vehicleId)
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

        public async Task<BulkReplacementResult> SmartBulkReplaceAsync(int accidentId)
        {
            var accident = _accidentRepository.GetAll()
                .FirstOrDefault(a => a.AccidentId == accidentId);
            if (accident == null)
                return new BulkReplacementResult { Success = false, Message = "Accident not found" };

            var remainingContracts = _contractService.GetAffectedContracts(accident.VehicleId)
                .Where(c => c.VehicleId == accident.VehicleId)
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
            if (availableVehicles == null || !availableVehicles.Any())
                return null;

            if (contract?.Vehicle == null)
                return availableVehicles.FirstOrDefault();

            var bestMatch = availableVehicles
                .FirstOrDefault(v => v?.Vehicle != null &&
                                   v.Vehicle.ModelId == contract.Vehicle.ModelId &&
                                   v.Vehicle.StationId == contract.StationId);

            if (bestMatch != null) return bestMatch;

            bestMatch = availableVehicles
                .FirstOrDefault(v => v?.Vehicle != null &&
                                   v.Vehicle.ModelId == contract.Vehicle.ModelId);

            if (bestMatch != null) return bestMatch;

            return availableVehicles.FirstOrDefault(v => v?.Vehicle != null);
        }

        private async Task<ModificationResultDto> ReplaceSingleContract(RentalContract contract, int newVehicleId)
        {
            return await SelectReplacementVehicle(contract.ContractId, newVehicleId);
        }

        public async Task<ReplacementPreviewDto> GetReplacementPreviewAsync(int accidentId)
        {
            try
            {
                var accident = _accidentRepository.GetAll().FirstOrDefault(a => a.AccidentId == accidentId);
                if (accident == null)
                    return new ReplacementPreviewDto { Success = false, Message = "Accident not found" };

                var affectedContracts = _contractService.GetAffectedContracts(accident.VehicleId)
                    .Where(c => c.VehicleId == accident.VehicleId)
                    .OrderBy(c => c.StartTime)
                    .ToList();

                var previewResults = new List<ContractReplacementPreview>();

                foreach (var contract in affectedContracts)
                {
                    var firstAvailable = (await GetAvailableReplacementOptions(contract.ContractId)).FirstOrDefault();

                    if (firstAvailable != null)
                    {
                        var lockKey = $"vehicle_replacement:{firstAvailable.Vehicle.VehicleId}:{contract.ContractId}";
                        var lockToken = Guid.NewGuid().ToString();
                        var lockExpiry = TimeSpan.FromMinutes(5);

                        if (_distributedLock.AcquireLock(lockKey, lockToken, lockExpiry))
                        {
                            previewResults.Add(new ContractReplacementPreview
                            {
                                ContractId = contract.ContractId,
                                RenterName = contract.EVRenter?.Account?.FullName ?? "Unknown",
                                StartTime = contract.StartTime,
                                CurrentVehicleId = (int)contract.VehicleId,
                                NewVehicleId = firstAvailable.Vehicle.VehicleId,
                                NewVehicleInfo = $"{firstAvailable.Vehicle.LicensePlate} - {firstAvailable.Vehicle.ModelName}",
                                WillBeReplaced = true,
                                ReplacementType = firstAvailable.OptionType,
                                LockToken = lockToken,
                                LockKey = lockKey,
                                LockExpiresAt = DateTime.UtcNow.Add(lockExpiry)
                            });
                        }
                        else
                        {
                            previewResults.Add(new ContractReplacementPreview
                            {
                                ContractId = contract.ContractId,
                                WillBeReplaced = false,
                                Reason = "Vehicle is currently being assigned to another contract"
                            });
                        }
                    }
                    else
                    {
                        previewResults.Add(new ContractReplacementPreview
                        {
                            ContractId = contract.ContractId,
                            WillBeReplaced = false,
                            Reason = "No available replacement vehicle"
                        });
                    }
                }

                return new ReplacementPreviewDto
                {
                    Success = true,
                    AccidentId = accidentId,
                    TotalContracts = affectedContracts.Count,
                    CanBeReplaced = previewResults.Count(r => r.WillBeReplaced),
                    CannotBeReplaced = previewResults.Count(r => !r.WillBeReplaced),
                    PreviewResults = previewResults
                };
            }
            catch (Exception ex)
            {
                return new ReplacementPreviewDto { Success = false, Message = $"Error generating preview: {ex.Message}" };
            }
        }

        public async Task<ModificationResultDto> ConfirmFirstAvailableVehicle(int contractId, string lockKey, string lockToken)
        {
            try
            {
                // Verify lock ownership using the new method
                if (!await _distributedLock.VerifyLockOwnershipAsync(lockKey, lockToken))
                {
                    return new ModificationResultDto
                    {
                        Success = false,
                        Message = "Lock expired or invalid. Please refresh the preview and try again."
                    };
                }

                var contract = _contractService.GetEntityById(contractId);
                if (contract == null)
                {
                    _distributedLock.ReleaseLock(lockKey, lockToken);
                    return new ModificationResultDto { Success = false, Message = "Contract not found" };
                }

                // Extract vehicle ID from lock key and verify availability
                var vehicleId = ExtractVehicleIdFromLockKey(lockKey);
                var isStillAvailable = await CheckVehicleAvailabilityForContractAsync(vehicleId, contract);

                if (!isStillAvailable)
                {
                    _distributedLock.ReleaseLock(lockKey, lockToken);
                    return new ModificationResultDto
                    {
                        Success = false,
                        Message = "Vehicle no longer available for this contract period"
                    };
                }

                // Perform the assignment
                contract.VehicleId = vehicleId;
                _contractService.UpdateContract(contract);

                // Release the lock after successful assignment
                _distributedLock.ReleaseLock(lockKey, lockToken);

                return new ModificationResultDto
                {
                    Success = true,
                    Message = $"Vehicle {vehicleId} successfully assigned to contract {contractId}"
                };
            }
            catch (Exception ex)
            {
                // Always release lock on error
                _distributedLock.ReleaseLock(lockKey, lockToken);
                return new ModificationResultDto { Success = false, Message = $"Error replacing vehicle: {ex.Message}" };
            }
        }

        private int ExtractVehicleIdFromLockKey(string lockKey)
        {
            var parts = lockKey.Split(':');
            return int.Parse(parts[1]);
        }

        private async Task<bool> CheckVehicleAvailabilityForContractAsync(int vehicleId, RentalContract contract)
        {
            var options = await GetAvailableReplacementOptions(contract.ContractId);
            return options.Any(o => o.Vehicle.VehicleId == vehicleId);
        }

        public async Task<SingleContractPreviewDto> GetSingleContractPreviewAsync(int contractId)
        {
            try
            {
                var contract = _contractService.GetEntityById(contractId);
                if (contract == null)
                    return new SingleContractPreviewDto { Success = false, Message = "Contract not found" };

                var firstAvailable = (await GetAvailableReplacementOptions(contractId)).FirstOrDefault();

                if (firstAvailable == null)
                {
                    return new SingleContractPreviewDto
                    {
                        Success = true,
                        WillBeReplaced = false,
                        Reason = "No available replacement vehicle"
                    };
                }

                var lockKey = $"vehicle_replacement:{firstAvailable.Vehicle.VehicleId}:{contractId}";
                var lockToken = Guid.NewGuid().ToString();
                var lockExpiry = TimeSpan.FromMinutes(5);

                if (!_distributedLock.AcquireLock(lockKey, lockToken, lockExpiry))
                {
                    return new SingleContractPreviewDto
                    {
                        Success = true,
                        WillBeReplaced = false,
                        Reason = "Vehicle is currently being assigned to another contract"
                    };
                }

                return new SingleContractPreviewDto
                {
                    Success = true,
                    WillBeReplaced = true,
                    ContractId = contractId,
                    NewVehicleId = firstAvailable.Vehicle.VehicleId,
                    NewVehicleInfo = $"{firstAvailable.Vehicle.LicensePlate} - {firstAvailable.Vehicle.ModelName}",
                    ReplacementType = firstAvailable.OptionType,
                    LockToken = lockToken,
                    LockKey = lockKey,
                    LockExpiresAt = DateTime.UtcNow.Add(lockExpiry)
                };
            }
            catch (Exception ex)
            {
                return new SingleContractPreviewDto { Success = false, Message = $"Error generating preview: {ex.Message}" };
            }
        }
    }
}