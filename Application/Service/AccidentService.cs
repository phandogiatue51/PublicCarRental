using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.BadScenario;
using PublicCarRental.Application.DTOs.Bran;
using PublicCarRental.Application.Service.Cont;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Application.Service.Rabbit;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Staf;
using PublicCarRental.Infrastructure.Data.Repository.Vehi;
using System.Linq.Expressions;

namespace PublicCarRental.Application.Service
{
    public class AccidentService : IAccidentService
    {
        private readonly IAccidentRepository _accidentRepository;
        private readonly IImageStorageService _imageStorageService;
        private readonly IVehicleRepository _vehicleRepository;
        private readonly IContractRepository _contractRepository;
        private readonly AccidentEventProducerService _accidentEventProducerService;
        private readonly IStaffRepository _staffRepository;
        private readonly IServiceProvider _serviceProvider;

        public AccidentService(IAccidentRepository accidentRepository, IImageStorageService imageStorageService,
            IVehicleRepository vehicleRepository, IContractRepository contractRepository,
            AccidentEventProducerService accidentEventProducerService, IStaffRepository staffRepository,
            IServiceProvider serviceProvider)
        {
            _accidentRepository = accidentRepository;
            _imageStorageService = imageStorageService;
            _vehicleRepository = vehicleRepository;
            _contractRepository = contractRepository;
            _accidentEventProducerService = accidentEventProducerService;
            _staffRepository = staffRepository;
            _serviceProvider = serviceProvider;
        }

        public async Task<IEnumerable<AccidentDto>> GetAllAsync()
        {
            var accidents = _accidentRepository.GetAll().ToList();
            var staffs = _staffRepository.GetAll()
                .Where(s => s.Account != null)
                .ToDictionary(s => s.StaffId, s => s.Account.FullName);

            return accidents.Select(m => new AccidentDto
            {
                AccidentId = m.AccidentId,
                VehicleId = m.VehicleId,
                LicensePlate = m.Vehicle.LicensePlate,
                ContractId = m.ContractId,
                StaffId = m.StaffId,
                StaffName = m.StaffId.HasValue && staffs.ContainsKey(m.StaffId.Value)
                    ? staffs[m.StaffId.Value]
                    : null,
                Description = m.Description,
                StationId = m.Vehicle.StationId,
                Location = m.Vehicle.Station.Name,
                ImageUrl = m.ImageUrl,
                Status = m.Status,
                ResolutionNote = m.ResolutionNote,
                ActionTaken = m.ActionTaken
            }).ToList();
        }

        public async Task<AccidentDto?> GetByIdAsync(int id)
        {
            var acc = _accidentRepository.GetAll()
            .FirstOrDefault(a => a.AccidentId == id);

            if (acc == null) return null;

            var staff = _staffRepository.GetById((int)acc.StaffId);
            return new AccidentDto
            {
                AccidentId = acc.AccidentId,
                VehicleId = acc.VehicleId,
                LicensePlate = acc.Vehicle.LicensePlate,
                ContractId = acc.ContractId,
                StaffId = acc.StaffId,
                StaffName = staff.Account.FullName,
                Description = acc.Description,
                StationId = acc.Vehicle.StationId,
                Location = acc.Vehicle.Station.Name,
                ImageUrl = acc.ImageUrl,
                Status = acc.Status,
                ResolutionNote = acc.ResolutionNote,
                ActionTaken = acc.ActionTaken
            };
        }

        public AccidentReport GetEntityById(int id) => _accidentRepository.GetAll().FirstOrDefault(a => a.AccidentId == id);

        public async Task<(bool Success, string Message)> CreateContractAccAsync(ContractAcc dto)
        {
            try
            {
                var acc = new AccidentReport
                {
                    ContractId = dto.ContractId,
                    StaffId = dto.StaffId,
                    Description = dto.Description,
                    Status = AccidentStatus.Reported,
                };

                var contract = _contractRepository.GetById((int)dto.ContractId);
                acc.VehicleId = (int)contract.VehicleId;
                acc.Location = contract.Station.Name;

                if (dto.ImageUrl != null && dto.ImageUrl.Length > 0)
                {
                    acc.ImageUrl = await _imageStorageService.UploadImageAsync(dto.ImageUrl);
                }

                var vehicle = _vehicleRepository.GetById(acc.VehicleId);
                vehicle.Status = VehicleStatus.ToBeCheckup;
                _vehicleRepository.Update(vehicle);

                _accidentRepository.CreateAcc(acc);

                await _accidentEventProducerService.PublishAccidentReportedAsync(acc);

                return (true, $"Fixing report for contract {dto.ContractId} created successfully!");
            }
            catch (Exception ex)
            {
                return (false, ex.ToString());
            }
        }

        public async Task<(bool Success, string Message)> CreateVehicleAccAsync(VehicleAcc dto)
        {
            try
            {
                var acc = new AccidentReport
                {
                    VehicleId = dto.VehicleId,
                    StaffId = dto.StaffId,
                    Description = dto.Description,
                    Status = AccidentStatus.Reported
                };

                var vehicle = _vehicleRepository.GetById(dto.VehicleId);
                vehicle.Status = VehicleStatus.ToBeCheckup;
                _vehicleRepository.Update(vehicle);
                acc.Location = vehicle.Station.Name;

                if (dto.ImageUrl != null && dto.ImageUrl.Length > 0)
                {
                    acc.ImageUrl = await _imageStorageService.UploadImageAsync(dto.ImageUrl);
                }

                _accidentRepository.CreateAcc(acc);

                await _accidentEventProducerService.PublishAccidentReportedAsync(acc);

                return (true, $"Fixing report for vehicle {dto.VehicleId} created successfully!");
            }
            catch (Exception ex)
            {
                return (false, ex.ToString());
            }
        }

        public async Task<(bool Success, string Message)> DeleteAccAsync(int id)
        {
            try
            {
                var acc = _accidentRepository.GetAll()
                .FirstOrDefault(a => a.AccidentId == id);

                if (acc == null)
                {
                    return (false, "Accident report not found!");
                }

                _accidentRepository.DeleteAcc(acc);
                return (true, "Accident report deleted successfully!");

            }
            catch (Exception ex)
            {
                return (false, ex.ToString());
            }
        }

        public async Task<(bool Success, string Message)> UpdateAccident(int id, AccidentUpdateDto dto)
        {
            try
            {
                var acc = await _accidentRepository.GetAll()
                    .Include(a => a.Vehicle)
                    .FirstOrDefaultAsync(a => a.AccidentId == id);

                if (acc == null) return (false, "Accident report not found!");

                acc.Status = dto.Status;
                acc.ActionTaken = dto.ActionTaken;
                acc.ResolutionNote = dto.ResolutionNote;
                acc.ResolvedAt = dto.ResolvedAt ?? DateTime.UtcNow;

                if (string.IsNullOrWhiteSpace(acc.ResolutionNote))
                {
                    acc.ResolutionNote = !string.IsNullOrWhiteSpace(dto.ResolutionNote)
                        ? dto.ResolutionNote
                        : dto.ActionTaken.HasValue
                            ? await ExecuteAccidentAction(acc, dto.ActionTaken.Value)
                            : null;
                }

                switch (dto.Status)
                {
                    case AccidentStatus.UnderInvestigation:
                    case AccidentStatus.RepairApproved:
                        await _accidentEventProducerService.PublishActionMessage(acc);
                        break;

                    case AccidentStatus.UnderRepair:
                        acc.Vehicle.Status = VehicleStatus.InMaintenance;
                        break;

                    case AccidentStatus.Repaired:
                        acc.Vehicle.Status = VehicleStatus.ToBeRented;
                        await _accidentEventProducerService.PublishVehicleReadyAsync(acc);
                        break;
                }

                _accidentRepository.UpdateAcc(acc);
                return (true, $"Accident #{id} updated successfully");
            }
            catch (Exception ex)
            {
                return (false, ex.Message);
            }
        }

        private async Task<string> ExecuteAccidentAction(AccidentReport accident, ActionType actionType)
        {
            using var scope = _serviceProvider.CreateScope();
            var contractHandler = scope.ServiceProvider.GetRequiredService<IContractAccidentHandler>();

            return actionType switch
            {
                ActionType.Refund => "Please attempt to contact renter from affected contract and change model. Refund if requested.",
                ActionType.Replace => "Replace all contract with new vehicles. Process refund if unable to change.",
                ActionType.RepairOnly => "Simply repair vehicle.",
                _ => "Unknown action type"
            };
        }

        public IEnumerable<AccidentDto?> FilterAccidents(AccidentStatus? status, int? stationId)
        {
            var staffs = _staffRepository.GetAll()
                .Where(s => s.Account != null)
                .ToDictionary(s => s.StaffId, s => s.Account.FullName);

            return _accidentRepository.GetAll()
                .Where(a => (!status.HasValue || a.Status == status.Value) &&
                            (!stationId.HasValue || a.Vehicle.StationId == stationId.Value))
                .Select(m => new AccidentDto
                {
                    AccidentId = m.AccidentId,
                    VehicleId = m.VehicleId,
                    LicensePlate = m.Vehicle.LicensePlate,
                    ContractId = m.ContractId,
                    StaffId = m.StaffId,
                    StaffName = m.StaffId.HasValue && staffs.ContainsKey(m.StaffId.Value)
                        ? staffs[m.StaffId.Value]
                        : null,
                    Description = m.Description,
                    StationId = m.Vehicle.StationId,
                    Location = m.Vehicle.Station.Name,
                    ImageUrl = m.ImageUrl,
                    Status = m.Status,
                    ResolutionNote = m.ResolutionNote,
                    ActionTaken = m.ActionTaken,
                    ReportedAt = m.ReportedAt
                }).ToList();
        }
    }

    public interface IAccidentService
    {
        Task<IEnumerable<AccidentDto>> GetAllAsync();
        Task<AccidentDto?> GetByIdAsync(int id);
        public AccidentReport GetEntityById(int id);
        Task<(bool Success, string Message)> CreateContractAccAsync(ContractAcc dto);
        Task<(bool Success, string Message)> CreateVehicleAccAsync(VehicleAcc dto);
        Task<(bool Success, string Message)> DeleteAccAsync(int id);
        Task<(bool Success, string Message)> UpdateAccident(int id, AccidentUpdateDto dto);
        public IEnumerable<AccidentDto?> FilterAccidents(AccidentStatus? status, int? stationId);
    }
}
