namespace PublicCarRental.Application.DTOs.Veh
{
    public class VehicleOptionDto
    {
        public VehicleDto Vehicle { get; set; }
        public string OptionType { get; set; } 
        public decimal PriceDifference { get; set; }
        public string Message => PriceDifference switch
        {
            > 0 => $"Upgrade (+{PriceDifference:C}/hour)",
            < 0 => $"Downgrade ({PriceDifference:C}/hour)",
            _ => "Same price"
        };
    }
}
