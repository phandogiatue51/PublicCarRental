using PublicCarRental.Application.DTOs.AdminDashboard;
using PublicCarRental.Application.DTOs.AdminDashboard.Customer;
using PublicCarRental.Application.DTOs.AdminDashboard.Rate;
using PublicCarRental.Application.DTOs.AdminDashboard.Revenue;
using PublicCarRental.Application.DTOs.AdminDashboard.Vehi;

namespace PublicCarRental.Application.Service.Dashboard
{
    public interface IAdminDashboardService
    {
        Task<AdminOverviewDto> GetSystemOverviewAsync();
        Task<FleetManagementDto> GetFleetManagementAsync();
        Task<List<StationPerformanceDto>> GetStationsPerformanceAsync();
        Task<CustomerAnalyticsDto> GetCustomerAnalyticsAsync();
        Task<List<RiskCustomerDto>> GetRiskCustomersAsync();
        Task<StaffPerformanceDto> GetStaffPerformanceAsync();
        Task<FinancialReportDto> GetFinancialReportAsync(DateRange dateRange);
        Task<RatingAnalyticsDto> GetRatingAnalyticsAsync();
    }
}
