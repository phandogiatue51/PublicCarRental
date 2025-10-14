namespace PublicCarRental.Application.Service
{
    public interface IPdfStorageService
    {
        Task SaveContractPdfAsync(int contractId, byte[] pdfBytes);
        byte[] GetContractPdf(int contractId);
    }

    public class PdfStorageService : IPdfStorageService
    {
        private readonly string _pdfStoragePath;

        public PdfStorageService(IConfiguration configuration)
        {
            _pdfStoragePath = configuration["PdfStorage:Path"] ?? "Contracts/Pdfs";

            // Ensure directory exists
            if (!Directory.Exists(_pdfStoragePath))
            {
                Directory.CreateDirectory(_pdfStoragePath);
            }
        }

        public async Task SaveContractPdfAsync(int contractId, byte[] pdfBytes)
        {
            var filePath = GetPdfFilePath(contractId);
            await File.WriteAllBytesAsync(filePath, pdfBytes);
        }

        public byte[] GetContractPdf(int contractId)
        {
            var filePath = GetPdfFilePath(contractId);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"PDF for contract {contractId} not found");
            }

            return File.ReadAllBytes(filePath);
        }

        private string GetPdfFilePath(int contractId)
        {
            return Path.Combine(_pdfStoragePath, $"contract-{contractId}.pdf");
        }
    }
}
