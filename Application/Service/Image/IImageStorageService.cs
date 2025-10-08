namespace PublicCarRental.Application.Service.Image
{
    public interface IImageStorageService
    {
        Task<string> UploadImageAsync(IFormFile file);
        Task<bool> DeleteImageAsync(string imageUrl);
        Task<string> UpdateImageAsync(string oldImageUrl, IFormFile newImageFile);
    }
}
