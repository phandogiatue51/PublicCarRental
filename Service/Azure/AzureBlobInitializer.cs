using Azure.Storage.Blobs;

namespace PublicCarRental.Service.Azure
{
    // Create a service that runs on startup
    public class AzureBlobInitializer : IHostedService
    {
        private readonly IConfiguration _configuration;

        public AzureBlobInitializer(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            var connectionString = _configuration["AzureBlobStorage:ConnectionString"];
            var containerName = _configuration["AzureBlobStorage:ContainerName"];

            var blobServiceClient = new BlobServiceClient(connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
            await containerClient.CreateIfNotExistsAsync();

            Console.WriteLine("Azure Blob container created successfully!");
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
