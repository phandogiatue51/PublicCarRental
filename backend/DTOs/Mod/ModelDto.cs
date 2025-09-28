namespace PublicCarRental.DTOs.Mod
{
    public class ModelDto
    {
        public int ModelId { get; set; }
        public string Name { get; set; }
        public int BrandId { get; set; }
        public string BrandName { get; set; }
        public int TypeId { get; set; }
        public string TypeName { get; set; }

        public string? ImageUrl { get; set; }
    }
}
