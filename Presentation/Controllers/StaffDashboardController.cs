using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.StaffDashboard;
using PublicCarRental.Application.Service.Dashboard;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StaffDashboardController : ControllerBase
    {
        private readonly IStaffDashboardService _staffDashboardService;

        public StaffDashboardController(IStaffDashboardService staffDashboardService)
        {
            _staffDashboardService = staffDashboardService;
        }

        [HttpGet("station/{stationId}/overview")]
        public async Task<ActionResult<StaffStationOverviewDto>> GetStationOverview(int stationId)
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
        public async Task<ActionResult<List<TodayRentalDto>>> GetIncomingCheckIns(
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
        public async Task<ActionResult<List<TodayRentalDto>>> GetIncomingCheckOuts(
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
        public async Task<ActionResult<List<VehicleAtStationDto>>> GetMaintenanceQueue(int stationId)
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
        public async Task<ActionResult<List<VehicleAtStationDto>>> GetLowBatteryVehicles(int stationId)
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
    }
}
