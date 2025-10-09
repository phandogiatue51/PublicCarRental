using PublicCarRental.Application.DTOs.Bran;

namespace PublicCarRental.Application.Service.Bran
{
    public interface IBrandService
    {
        Task<IEnumerable<BrandDto>> GetAllAsync();
        Task<BrandDto?> GetByIdAsync(int id);
        Task<int> CreateBrandAsync(BrandUpdateDto dto);
        Task<bool> UpdateBrandAsync(int id, BrandUpdateDto updatedBrand);
        Task<bool> DeleteBrandAsync(int id);

    }
}
