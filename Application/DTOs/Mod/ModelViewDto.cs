namespace PublicCarRental.Application.DTOs.Mod
{
    public class ModelViewDto
    {
        public int ModelId { get; set; }
        public string Name { get; set; }
        public string BrandName { get; set; }
        public string TypeName { get; set; }

        public decimal PricePerHour { get; set; }

        public string? ImageUrl { get; set; }
    }
}
