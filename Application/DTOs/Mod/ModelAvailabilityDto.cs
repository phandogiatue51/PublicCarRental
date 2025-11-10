namespace PublicCarRental.Application.DTOs.Mod
{
    public class ModelAvailabilityDto
    {
        public int ModelId { get; set; }
        public string ModelName { get; set; }
        public string Brand { get; set; }
        public int Count { get; set; }
        public decimal PricePerHour { get; set; }
    }
}
