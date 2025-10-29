using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.StaffDashboard;
using PublicCarRental.Application.DTOs.Veh;
using PublicCarRental.Application.Service.Dashboard;
using PublicCarRental.Application.Service.Veh;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StaffDashboardController : ControllerBase
    {
        private readonly IStaffDashboardService _staffDashboardService;
        private readonly IVehicleService _vehicleService;

        public StaffDashboardController(IStaffDashboardService staffDashboardService, IVehicleService vehicleService)
        {
            _staffDashboardService = staffDashboardService;
            _vehicleService = vehicleService;
        }

        [HttpGet("station/{stationId}/overview")]
        public async Task<ActionResult> GetStationOverview(int stationId)
        {
            try
            {
                var overview = await _staffDashboardService.GetStationOverviewAsync(stationId);
                return Ok(overview);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("station/{stationId}/incoming-checkins")]
        public async Task<ActionResult> GetIncomingCheckIns(
            int stationId,
            [FromQuery] int count = 5)
        {
            try
            {
                var checkIns = await _staffDashboardService.GetIncomingCheckInsAsync(stationId, count);
                return Ok(checkIns);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("station/{stationId}/incoming-checkouts")]
        public async Task<ActionResult> GetIncomingCheckOuts(
            int stationId,
            [FromQuery] int count = 5)
        {
            try
            {
                var checkOuts = await _staffDashboardService.GetIncomingCheckOutsAsync(stationId, count);
                return Ok(checkOuts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("station/{stationId}/maintenance-queue")]
        public async Task<ActionResult> GetMaintenanceQueue(int stationId)
        {
            try
            {
                var maintenanceQueue = await _staffDashboardService.GetMaintenanceQueueAsync(stationId);
                return Ok(maintenanceQueue);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("station/{stationId}/low-battery-vehicles")]
        public async Task<ActionResult> GetLowBatteryVehicles(int stationId)
        {
            try
            {
                var lowBatteryVehicles = await _staffDashboardService.GetLowBatteryVehiclesAsync(stationId);
                return Ok(lowBatteryVehicles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("station/{stationId}/available-vehicles")]
        public async Task<ActionResult> GetAvailableVehicles(int stationId)
        {
            try
            {
                // Use UTC and specify DateTimeKind
                var todayUtc = DateTime.UtcNow.Date;
                var startTime = new DateTime(todayUtc.Year, todayUtc.Month, todayUtc.Day, 1, 0, 0, DateTimeKind.Utc); // 1:00 AM UTC
                var endTime = new DateTime(todayUtc.Year, todayUtc.Month, todayUtc.Day, 23, 59, 59, DateTimeKind.Utc); // 11:59:59 PM UTC

                var availableVehicles = await _vehicleService.GetAvailableAsync(startTime, endTime, stationId);
                return Ok(availableVehicles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
