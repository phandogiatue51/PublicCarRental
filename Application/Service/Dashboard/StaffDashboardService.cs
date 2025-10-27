using PublicCarRental.Application.DTOs.StaffDashboard;

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
    public class StaffDashboardService
    {
    }
}
