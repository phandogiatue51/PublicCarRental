using PublicCarRental.Models;

namespace PublicCarRental.Service.Bran
{
    public interface IBrandService
    {
        IEnumerable<VehicleBrand> GetAllBrands();
        VehicleBrand GetBrandById(int id);
        void CreateBrand(VehicleBrand brand);
        bool UpdateBrand(int id, VehicleBrand updatedBrand);
        bool DeleteBrand(int id);
    }
}
