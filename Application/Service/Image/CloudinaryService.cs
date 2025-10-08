using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using PublicCarRental.Infrastructure.Data.Models.Configuration;
using System.Text.RegularExpressions;

namespace PublicCarRental.Application.Service.Image
{
    public class CloudinaryService : IImageStorageService
    {
        private readonly Cloudinary _cloudinary;
        private readonly string _cloudName;

        public CloudinaryService(IConfiguration config)
        {
            // Use GetSection().Get<T>() for configuration binding
            var settings = config.GetSection("CloudinarySettings").Get<CloudinarySettings>();

            // Basic validation to prevent null reference exceptions
            if (settings == null || string.IsNullOrEmpty(settings.CloudName))
            {
                throw new ArgumentNullException("Cloudinary settings are missing or incomplete in configuration.");
            }

            _cloudName = settings.CloudName;
            var account = new Account(
                settings.CloudName,
                settings.ApiKey,
                settings.ApiSecret
            );
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            using var stream = file.OpenReadStream();

            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(file.FileName, stream),
                PublicId = $"car-rental/{Guid.NewGuid()}",
                Transformation = new Transformation().Width(500).Crop("limit")
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            return uploadResult.SecureUrl.AbsoluteUri;
        }

        public async Task<bool> DeleteImageAsync(string imageUrl)
        {
            try
            {
                var publicId = GetPublicIdFromUrl(imageUrl);

                if (string.IsNullOrEmpty(publicId)) return false;

                var deletionParams = new DeletionParams(publicId);
                var deletionResult = await _cloudinary.DestroyAsync(deletionParams);

                return deletionResult.Result == "ok";
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> UpdateImageAsync(string oldImageUrl, IFormFile newImageFile)
        {
            if (!string.IsNullOrEmpty(oldImageUrl))
            {
                await DeleteImageAsync(oldImageUrl);
            }

            return await UploadImageAsync(newImageFile);
        }

        private string GetPublicIdFromUrl(string url)
        {
            if (string.IsNullOrEmpty(url)) return null;
            if (!url.Contains(_cloudName))
            {
                return null;
            }

            var startTag = "/upload/";
            var startIndex = url.IndexOf(startTag);

            if (startIndex == -1) return null;

            var segment = url.Substring(startIndex + startTag.Length);

            var versionTagRegex = new Regex(@"v\d+/");
            var match = versionTagRegex.Match(segment);

            if (match.Success)
            {
                var publicIdWithExtension = segment.Substring(match.Index + match.Length);

                var lastDotIndex = publicIdWithExtension.LastIndexOf('.');
                if (lastDotIndex > 0)
                {
                    return publicIdWithExtension.Substring(0, lastDotIndex);
                }

                return publicIdWithExtension;
            }

            return null;
        }
    }
}