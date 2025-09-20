using PublicCarRental.DTOs.Bran;
using PublicCarRental.Models;

namespace PublicCarRental.Service.Bran
{
    public interface IBrandService
    {
        public IEnumerable<BrandDto> GetAll();
        public BrandDto? GetById(int id);
        public int CreateBrand(BrandUpdateDto dto);
        public bool UpdateBrand(int id, BrandUpdateDto updatedBrand);
        bool DeleteBrand(int id);
    }
}
