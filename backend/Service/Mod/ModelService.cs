using PublicCarRental.DTOs.Mod;
using PublicCarRental.Models;
using PublicCarRental.Repository.Model;
using Microsoft.AspNetCore.Http;

namespace PublicCarRental.Service.Mod
{
    public class ModelService : IModelService
    {
        private readonly IModelRepository _repo;

        public ModelService(IModelRepository repo)
        {
            _repo = repo;
        }

        public IEnumerable<ModelDto> GetAllModels()
        {
            return _repo.GetAll()
                .Select(m => new ModelDto
                {
                    ModelId = m.ModelId,
                    Name = m.Name,
                    BrandId = m.BrandId,
                    BrandName = m.Brand != null ? m.Brand.Name : null,
                    TypeId = m.TypeId,
                    TypeName = m.Type != null ? m.Type.Name : null,
                    ImageUrl = m.ImageUrl
                })
                .ToList();
        }

        public ModelDto GetById(int id)
        {
            var m = _repo.GetById(id);
            if (m == null) return null;
            return new ModelDto
            {
                ModelId = m.ModelId,
                Name = m.Name,
                BrandId = m.BrandId,
                BrandName = m.Brand?.Name,
                TypeId = m.TypeId,
                TypeName = m.Type?.Name,
                ImageUrl = m.ImageUrl
            };
        }
        public VehicleModel GetEntityById(int id)
        {
            return _repo.GetById(id);
        }

        public int CreateModel(ModelCreateDto dto, IFormFile imageFile = null)
        {
            var model = new VehicleModel
            {
                Name = dto.Name,
                BrandId = dto.BrandId,
                TypeId = dto.TypeId
            };

            if (imageFile != null && imageFile.Length > 0)
            {
                // Save the uploaded file to image/models directory
                var imagePath = Path.Combine("image", "models");
                if (!Directory.Exists(imagePath))
                {
                    Directory.CreateDirectory(imagePath);
                }

                var fileName = Path.GetFileName(imageFile.FileName);
                var filePath = Path.Combine(imagePath, fileName);
                
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    imageFile.CopyTo(stream);
                }

                model.ImageUrl = $"/image/models/{fileName}";
            }

            _repo.Create(model);
            return model.ModelId;
        }
        public bool UpdateModel(int id, ModelCreateDto updatedModel, IFormFile imageFile = null)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            existing.Name = updatedModel.Name;
            existing.BrandId = updatedModel.BrandId;
            existing.TypeId = updatedModel.TypeId;

            if (imageFile != null && imageFile.Length > 0)
            {
                // Save the uploaded file to image/models directory
                var imagePath = Path.Combine("image", "models");
                if (!Directory.Exists(imagePath))
                {
                    Directory.CreateDirectory(imagePath);
                }

                var fileName = Path.GetFileName(imageFile.FileName);
                var filePath = Path.Combine(imagePath, fileName);
                
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    imageFile.CopyTo(stream);
                }

                existing.ImageUrl = $"/image/models/{fileName}";
            }

            _repo.Update(existing);
            return true;
        }

        public bool DeleteModel(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            _repo.Delete(id);
            return true;
        }

        public IEnumerable<string> GetAvailableImages()
        {
            var imagePath = Path.Combine("image", "models");
            if (!Directory.Exists(imagePath))
            {
                return new List<string>();
            }

            var imageFiles = Directory.GetFiles(imagePath)
                .Where(file => IsImageFile(file))
                .Select(file => "/image/models/" + Path.GetFileName(file))
                .OrderBy(fileName => fileName);

            return imageFiles;
        }

        private bool IsImageFile(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            return new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" }.Contains(extension);
        }
    }
}
