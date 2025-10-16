namespace PublicCarRental.Application.Service.PDF
{
    public interface IPdfStorageService
    {
        Task SaveContractPdfAsync(int contractId, byte[] pdfBytes);
        byte[] GetContractPdf(int contractId);

        Task SaveReceiptPdfAsync(int invoiceId, byte[] pdfBytes);
        byte[] GetReceiptPdf(int invoiceId);

        Task SavePdfAsync(string type, int id, byte[] pdfBytes);
        byte[] GetPdf(string type, int id);
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

        // Contract methods
        public async Task SaveContractPdfAsync(int contractId, byte[] pdfBytes)
        {
            var filePath = GetContractPdfFilePath(contractId);
            await File.WriteAllBytesAsync(filePath, pdfBytes);
        }

        public byte[] GetContractPdf(int contractId)
        {
            var filePath = GetContractPdfFilePath(contractId);
            return GetPdfFile(filePath, $"contract {contractId}");
        }

        // Receipt methods
        public async Task SaveReceiptPdfAsync(int invoiceId, byte[] pdfBytes)
        {
            var filePath = GetReceiptPdfFilePath(invoiceId);
            await File.WriteAllBytesAsync(filePath, pdfBytes);
        }

        public byte[] GetReceiptPdf(int invoiceId)
        {
            var filePath = GetReceiptPdfFilePath(invoiceId);
            return GetPdfFile(filePath, $"receipt {invoiceId}");
        }

        // Generic methods
        public async Task SavePdfAsync(string type, int id, byte[] pdfBytes)
        {
            var filePath = GetPdfFilePath(type, id);
            await File.WriteAllBytesAsync(filePath, pdfBytes);
        }

        public byte[] GetPdf(string type, int id)
        {
            var filePath = GetPdfFilePath(type, id);
            return GetPdfFile(filePath, $"{type} {id}");
        }

        // Private helper methods
        private string GetContractPdfFilePath(int contractId)
        {
            return Path.Combine(_pdfStoragePath, $"contract-{contractId}.pdf");
        }

        private string GetReceiptPdfFilePath(int invoiceId)
        {
            return Path.Combine(_pdfStoragePath, $"receipt-{invoiceId}.pdf");
        }

        private string GetPdfFilePath(string type, int id)
        {
            return Path.Combine(_pdfStoragePath, $"{type}-{id}.pdf");
        }

        private byte[] GetPdfFile(string filePath, string description)
        {
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"PDF for {description} not found at {filePath}");
            }

            return File.ReadAllBytes(filePath);
        }
    }
}