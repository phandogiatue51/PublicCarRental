using Microsoft.EntityFrameworkCore;
using PublicCarRental.Application.DTOs.StaffDashboard;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Cont;
using PublicCarRental.Infrastructure.Data.Repository.Vehi;

namespace PublicCarRental.Application.Service.Dashboard
{
    public interface IStaffDashboardService
    {
        Task<StaffStationOverviewDto> GetStationOverviewAsync(int stationId);
        Task<List<TodayRentalDto>> GetIncomingCheckInsAsync(int stationId, int count = 5);    
        Task<List<TodayRentalDto>> GetIncomingCheckOutsAsync(int stationId, int count = 5);  
        Task<List<VehicleAtStationDto>> GetMaintenanceQueueAsync(int stationId);
        Task<List<VehicleAtStationDto>> GetLowBatteryVehiclesAsync(int stationId);
    }

    public class StaffDashboardService : IStaffDashboardService
    {
        private readonly IVehicleRepository _vehicleRepository;
        private readonly IContractRepository _contractRepository;
        private DateTime today => DateTime.UtcNow.Date;


        public StaffDashboardService(IVehicleRepository vehicleRepository, IContractRepository contractRepository)
        {
            _vehicleRepository = vehicleRepository;
            _contractRepository = contractRepository;
        }

        public async Task<StaffStationOverviewDto> GetStationOverviewAsync(int stationId)
        {
            var vehicleCounts = _vehicleRepository.GetAll()
                .Where(v => v.StationId == stationId)
                .GroupBy(v => v.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToList();

            var todayRentals = _contractRepository.GetAll()
                .Where(rc => rc.StationId == stationId &&
                           (rc.StartTime.Date == today || rc.EndTime.Date == today))
                .ToList();

            var ongoingRentals = _contractRepository.GetAll()
                .Where(rc => rc.StationId == stationId &&
                           rc.Status == RentalStatus.Active)
                .Count();

            var lowBatteryCount = _vehicleRepository.GetAll()
                .Where(v => v.StationId == stationId &&
                           v.BatteryLevel < 20 &&
                           v.Status != VehicleStatus.InMaintenance)
                .Count();

            var overview = new StaffStationOverviewDto
            {
                StationId = stationId,

                TotalVehicles = _vehicleRepository.GetAll()
                    .Where(v => v.StationId == stationId)
                    .Count(),

                AvailableVehicles = vehicleCounts
                    .FirstOrDefault(v => v.Status == VehicleStatus.Available)?.Count ?? 0,

                RentedVehicles = vehicleCounts
                    .FirstOrDefault(v => v.Status == VehicleStatus.Renting)?.Count ?? 0,

                InMaintenanceVehicles = vehicleCounts
                    .FirstOrDefault(v => v.Status == VehicleStatus.InMaintenance)?.Count ?? 0,

                ChargingVehicles = vehicleCounts
                    .FirstOrDefault(v => v.Status == VehicleStatus.Charging)?.Count ?? 0,

                IncomingCheckIns = todayRentals
                    .Count(rc => rc.EndTime.Date == today &&
                                (rc.Status == RentalStatus.Active || rc.Status == RentalStatus.Confirmed)),

                IncomingCheckOuts = todayRentals
                    .Count(rc => rc.StartTime.Date == today &&
                                (rc.Status == RentalStatus.Confirmed || rc.Status == RentalStatus.ToBeConfirmed)),

                OngoingContract = ongoingRentals,

                LowBatteryVehicles = lowBatteryCount
            };

            return overview;
        }

        public async Task<List<TodayRentalDto>> GetIncomingCheckInsAsync(int stationId, int count = 5)
        {
            var checkIns = await _contractRepository.GetAll()
                .Where(rc => rc.StationId == stationId &&
                           rc.EndTime.Date == today &&
                           (rc.Status == RentalStatus.Active || rc.Status == RentalStatus.Confirmed))
                .OrderBy(rc => rc.EndTime)
                .Take(count)
                .Select(rc => new TodayRentalDto
                {
                    ContractId = rc.ContractId,
                    CustomerName = rc.EVRenter.Account.FullName,
                    LicensePlate = rc.Vehicle.LicensePlate,
                    VehicleModel = rc.Vehicle.Model.Name,
                    ScheduledTime = rc.EndTime,
                    CustomerPhone = rc.EVRenter.Account.PhoneNumber,
                    LicenseNumber = rc.EVRenter.LicenseNumber
                })
                .ToListAsync();

            return checkIns;
        }

        public async Task<List<TodayRentalDto>> GetIncomingCheckOutsAsync(int stationId, int count = 5)
        {
            var checkOuts = await _contractRepository.GetAll()
                .Where(rc => rc.StationId == stationId &&
                           rc.StartTime.Date == today &&
                           (rc.Status == RentalStatus.Confirmed || rc.Status == RentalStatus.ToBeConfirmed))
                .OrderBy(rc => rc.StartTime)
                .Take(count)
                .Select(rc => new TodayRentalDto
                {
                    ContractId = rc.ContractId,
                    CustomerName = rc.EVRenter.Account.FullName,
                    LicensePlate = rc.Vehicle.LicensePlate,
                    VehicleModel = rc.Vehicle.Model.Name,
                    ScheduledTime = rc.StartTime,
                    CustomerPhone = rc.EVRenter.Account.PhoneNumber,
                    LicenseNumber = rc.EVRenter.LicenseNumber
                })
                .ToListAsync();

            return checkOuts;
        }

        public async Task<List<VehicleAtStationDto>> GetMaintenanceQueueAsync(int stationId)
        {
            var maintenanceVehicles = await _vehicleRepository.GetAll()
                .Where(v => v.StationId == stationId &&
                           (v.Status == VehicleStatus.InMaintenance || v.Status == VehicleStatus.ToBeCheckup))
                .Select(v => new VehicleAtStationDto
                {
                    VehicleId = v.VehicleId,
                    LicensePlate = v.LicensePlate,
                    VehicleModel = v.Model.Name,
                    Brand = v.Model.Brand.Name,
                    BatteryLevel = v.BatteryLevel,
                    Status = v.Status,
                    CurrentRentalContractId = v.RentalContracts
                        .FirstOrDefault(rc => rc.Status == RentalStatus.Active).ContractId
                })
                .ToListAsync();

            return maintenanceVehicles;
        }

        public async Task<List<VehicleAtStationDto>> GetLowBatteryVehiclesAsync(int stationId)
        {
            var lowBatteryVehicles = await _vehicleRepository.GetAll()
                .Where(v => v.StationId == stationId &&
                           v.BatteryLevel < 20 &&
                           v.Status != VehicleStatus.InMaintenance)
                .Select(v => new VehicleAtStationDto
                {
                    VehicleId = v.VehicleId,
                    LicensePlate = v.LicensePlate,
                    VehicleModel = v.Model.Name,
                    Brand = v.Model.Brand.Name,
                    BatteryLevel = v.BatteryLevel,
                    Status = v.Status,
                    CurrentRentalContractId = v.RentalContracts
                        .FirstOrDefault(rc => rc.Status == RentalStatus.Active).ContractId
                })
                .OrderBy(v => v.BatteryLevel) 
                .ToListAsync();

            return lowBatteryVehicles;
        }
    }

}
