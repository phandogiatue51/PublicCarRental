namespace PublicCarRental.Application.DTOs.StaffDashboard
{
    public class StaffStationOverviewDto
    {
        public int StationId { get; set; }

        public int TotalVehicles { get; set; }
        public int AvailableVehicles { get; set; }
        public int RentedVehicles { get; set; }
        public int InMaintenanceVehicles { get; set; }
        public int ChargingVehicles { get; set; }

        public int IncomingCheckIns { get; set; }      
        public int IncomingCheckOuts { get; set; }    
        public int OngoingContract { get; set; }     

        public int LowBatteryVehicles { get; set; } 
    }
}
