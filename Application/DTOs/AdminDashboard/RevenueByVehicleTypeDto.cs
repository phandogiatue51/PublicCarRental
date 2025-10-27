namespace PublicCarRental.Application.DTOs.AdminDashboard
{
    public class RevenueByVehicleTypeDto
    {
        public string VehicleType { get; set; }
        public decimal Revenue { get; set; }
        public int RentalCount { get; set; }
        public double MarketShare { get; set; }
    }
}
