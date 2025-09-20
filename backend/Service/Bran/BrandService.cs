using PublicCarRental.Models;
using PublicCarRental.Repository.Bran;

namespace PublicCarRental.Service.Bran
{
    public class BrandService : IBrandService
    {
        private readonly IBrandRepository _repo;

        public BrandService(IBrandRepository repo)
        {
            _repo = repo;
        }

        public IEnumerable<VehicleBrand> GetAllBrands()
        {
            return _repo.GetAll();
        }

        public VehicleBrand GetBrandById(int id)
        {
            return _repo.GetById(id);
        }

        public void CreateBrand(VehicleBrand brand)
        {
            _repo.Create(brand);
        }

        public bool UpdateBrand(int id, VehicleBrand updatedBrand)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            existing.Name = updatedBrand.Name;
            _repo.Update(existing);
            return true;
        }

        public bool DeleteBrand(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            _repo.Delete(id);
            return true;
        }
    }
}
