using PublicCarRental.Application.DTOs.Bran;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Repository.Bran;

namespace PublicCarRental.Application.Service.Bran
{
    public class BrandService : IBrandService
    {
        private readonly IBrandRepository _repo;

        public BrandService(IBrandRepository repo)
        {
            _repo = repo;
        }

        public IEnumerable<BrandDto> GetAll()
        {
            return _repo.GetAll()
                .Select(b => new BrandDto
                {
                    BrandId = b.BrandId,
                    Name = b.Name
                }).ToList();
        }

        public BrandDto? GetById(int id)
        {
            var brand = _repo.GetById(id);
            if (brand == null) return null;

            return new BrandDto
            {
                BrandId = brand.BrandId,
                Name = brand.Name
            };
        }

        public int CreateBrand(BrandUpdateDto dto)
        {
            var brand = new VehicleBrand
            {
                Name = dto.Name
            };
            _repo.Create(brand);
            return brand.BrandId;
        }

        public bool UpdateBrand(int id, BrandUpdateDto updatedBrand)
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
