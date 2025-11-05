using PublicCarRental.Application.Service;

namespace PublicCarRental.Application.DTOs.Pay
{
    public class BankAccountInfo
    {
        public string AccountNumber { get; set; }
        public string AccountName { get; set; }
        public string BankCode { get; set; }
        public void FillFromQR(string qrContent, IQRScannerService qrService = null)
        {
            qrService ??= new QRScannerService(new Logger<QRScannerService>(new LoggerFactory()));
            var scannedInfo = qrService.ParseVietQRContent(qrContent);

            this.AccountNumber = scannedInfo.AccountNumber ?? this.AccountNumber;
            this.AccountName = scannedInfo.AccountName ?? this.AccountName;
            this.BankCode = scannedInfo.BankCode ?? this.BankCode;
        }
    }
}
