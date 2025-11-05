using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.AdminDashboard;
using PublicCarRental.Application.DTOs.AdminDashboard.Customer;
using PublicCarRental.Application.DTOs.AdminDashboard.Rate;
using PublicCarRental.Application.DTOs.AdminDashboard.Revenue;
using PublicCarRental.Application.DTOs.AdminDashboard.Vehi;
using PublicCarRental.Application.Service.Dashboard;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IAdminDashboardService _adminDashboardService;

        public AdminDashboardController(IAdminDashboardService adminDashboardService)
        {
            _adminDashboardService = adminDashboardService;
        }

        [HttpGet("overview")]
        public async Task<ActionResult<AdminOverviewDto>> GetSystemOverview()
        {
            try
            {
                var overview = await _adminDashboardService.GetSystemOverviewAsync();
                return Ok(overview);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("fleet-management")]
        public async Task<ActionResult<FleetManagementDto>> GetFleetManagement()
        {
            try
            {
                var fleetData = await _adminDashboardService.GetFleetManagementAsync();
                return Ok(fleetData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("stations-performance")]
        public async Task<ActionResult<List<StationPerformanceDto>>> GetStationsPerformance()
        {
            try
            {
                var stationsPerformance = await _adminDashboardService.GetStationsPerformanceAsync();
                return Ok(stationsPerformance);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("customer-analytics")]
        public async Task<ActionResult<CustomerAnalyticsDto>> GetCustomerAnalytics()
        {
            try
            {
                var customerAnalytics = await _adminDashboardService.GetCustomerAnalyticsAsync();
                return Ok(customerAnalytics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("risk-customers")]
        public async Task<ActionResult<List<RiskCustomerDto>>> GetRiskCustomers()
        {
            try
            {
                var riskCustomers = await _adminDashboardService.GetRiskCustomersAsync();
                return Ok(riskCustomers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("staff-performance")]
        public async Task<ActionResult<StaffPerformanceDto>> GetStaffPerformance()
        {
            try
            {
                var staffPerformance = await _adminDashboardService.GetStaffPerformanceAsync();
                return Ok(staffPerformance);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("financial-report")]
        public async Task<ActionResult<InvoiceFinancialReportDto>> GetFinancialReport(DateRange dto)
        {
            try
            {
                var dateRange = new DateRange { StartDate = dto.StartDate, EndDate = dto.EndDate};
                var financialReport = await _adminDashboardService.GetInvoiceFinancialReportAsync(dateRange);
                return Ok(financialReport);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("rating-analytics")]
        public async Task<ActionResult<RatingAnalyticsDto>> GetRatingAnalytics()
        {
            try
            {
                var ratingAnalytics = await _adminDashboardService.GetRatingAnalyticsAsync();
                return Ok(ratingAnalytics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

}
