using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace PublicCarRental.Service;

public class AzureBlobService
{
    private readonly string _connectionString;
    private readonly string _containerName;

    public AzureBlobService(IConfiguration configuration)
    {
        _connectionString = configuration["AzureBlobStorage:ConnectionString"];
        _containerName = configuration["AzureBlobStorage:ContainerName"];
    }

    public async Task<string> UploadImageAsync(IFormFile file)
    {
        var blobServiceClient = new BlobServiceClient(_connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

        var blobName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var blobClient = containerClient.GetBlobClient(blobName);

        using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType }
        });

        return blobClient.Uri.ToString();
    }

    public async Task<bool> DeleteImageAsync(string imageUrl)
    {
        try
        {
            var blobServiceClient = new BlobServiceClient(_connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

            var blobName = Path.GetFileName(new Uri(imageUrl).AbsolutePath);
            var blobClient = containerClient.GetBlobClient(blobName);

            return await blobClient.DeleteIfExistsAsync();
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
}