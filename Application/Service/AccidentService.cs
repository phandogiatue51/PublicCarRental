using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs.Accident;
using PublicCarRental.Application.DTOs.Bran;
using PublicCarRental.Application.Service.Image;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
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

        public AccidentService(IAccidentRepository accidentRepository, IImageStorageService imageStorageService,
            IVehicleRepository vehicleRepository, IContractRepository contractRepository)
        {
            _accidentRepository = accidentRepository;
            _imageStorageService = imageStorageService;
            _vehicleRepository = vehicleRepository;
            _contractRepository = contractRepository;
        }

        public async Task<IEnumerable<AccidentDto>> GetAllAsync()
        {
            return _accidentRepository.GetAll()
                 .Select(m => new AccidentDto
                 {
                     AccidentId = m.AccidentId,
                     VehicleId = m.VehicleId,
                     ContractId = m.ContractId,
                     StaffId = m.StaffId,
                     Description = m.Description,
                     Location = m.Vehicle.Station.Name,
                     ImageUrl = m.ImageUrl,
                 }).ToList();
        }

        public async Task<AccidentDto?> GetByIdAsync(int id)
        {
            var acc = _accidentRepository.GetAll()
            .FirstOrDefault(a => a.AccidentId == id);

            if (acc == null) return null;

            return new AccidentDto
            {
                AccidentId = acc.AccidentId,
                VehicleId = acc.VehicleId,
                ContractId = acc.ContractId,
                StaffId = acc.StaffId,
                Description = acc.Description,
                Location = acc.Vehicle.Station.Name,
                ImageUrl = acc.ImageUrl,
            };
        }

        public async Task<(bool Success, string Message)> CreateContractAccAsync(ContractAcc dto)
        {
            try
            {
                var acc = new AccidentReport
                {
                    ContractId = dto.ContractId,
                    StaffId = dto.StaffId,
                    Description = dto.Description,
                    ReportedAt = DateTime.UtcNow,
                    Status = AccidentStatus.Reported,
                };

                var contract = _contractRepository.GetById((int)dto.ContractId);
                acc.VehicleId = (int)contract.VehicleId;
                acc.Location = contract.Station.Name;

                if (dto.ImageUrl != null && dto.ImageUrl.Length > 0)
                {
                    acc.ImageUrl = await _imageStorageService.UploadImageAsync(dto.ImageUrl);
                }

                _accidentRepository.CreateAcc(acc);
                return (true, $"Accident report for contract {dto.ContractId} created successfully!");
            } catch (Exception ex)
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
                    ReportedAt = DateTime.UtcNow,
                    Status = AccidentStatus.Reported
                };

                var vehicle = _vehicleRepository.GetById(dto.VehicleId);
                acc.Location = vehicle.Station.Name;

                if (dto.ImageUrl != null && dto.ImageUrl.Length > 0)
                {
                    acc.ImageUrl = await _imageStorageService.UploadImageAsync(dto.ImageUrl);
                }

                _accidentRepository.CreateAcc(acc);
                return (true, $"Accident report for vehicle {dto.VehicleId} created successfully!");

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

            } catch (Exception ex)
            {
                return (false, ex.ToString());
            }
        }
        public async Task<(bool Success, string Message)> UpdateAccStatusAsync(int id, AccidentStatus newStatus)
        {
            try
            {
                var acc = _accidentRepository.GetAll()
                    .FirstOrDefault(a => a.AccidentId == id);

                if (acc == null)
                    return (false, "Accident report not found!");

                if (!ValidTransitions.TryGetValue(acc.Status, out var allowedNext) || !allowedNext.Contains(newStatus))
                    return (false, $"Invalid status transition from {acc.Status} to {newStatus}");

                acc.Status = newStatus;
                _accidentRepository.UpdateAcc(acc);

                return (true, $"Accident report status updated to {newStatus}");
            }
            catch (Exception ex)
            {
                return (false, ex.Message);
            }
        }


        private static readonly Dictionary<AccidentStatus, AccidentStatus[]> ValidTransitions = new()
        {
            { AccidentStatus.Reported, new[] { AccidentStatus.UnderInvestigation } },
            { AccidentStatus.UnderInvestigation, new[] { AccidentStatus.RepairApproved } },
            { AccidentStatus.RepairApproved, new[] { AccidentStatus.UnderRepair } },
            { AccidentStatus.UnderRepair, new[] { AccidentStatus.Repaired } },
        };

    }

    public interface IAccidentService
    {
        Task<IEnumerable<AccidentDto>> GetAllAsync();
        Task<AccidentDto?> GetByIdAsync(int id);
        Task<(bool Success, string Message)> CreateContractAccAsync(ContractAcc dto);
        Task<(bool Success, string Message)> CreateVehicleAccAsync(VehicleAcc dto);
        Task<(bool Success, string Message)> DeleteAccAsync(int id); 
        Task<(bool Success, string Message)> UpdateAccStatusAsync(int id, AccidentStatus newStatus);

    }
}
