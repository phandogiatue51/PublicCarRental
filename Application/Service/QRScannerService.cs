using PublicCarRental.Application.DTOs.Pay;
using SixLabors.ImageSharp.PixelFormats;
using System.Drawing; // Add this
using System.Drawing.Imaging; // Add this
using ZXing;
using ZXing.Common;
using ZXing.QrCode;

namespace PublicCarRental.Application.Service
{
    public interface IQRScannerService
    {
        public BankAccountInfo ParseVietQRContent(string qrContent);
        Task<BankAccountInfo> ScanBankQRAsync();
        Task<BankAccountInfo> DecodeQRFromStream(Stream stream);
    }

    public class QRScannerService : IQRScannerService
    {
        private readonly ILogger<QRScannerService> _logger;

        public QRScannerService(ILogger<QRScannerService> logger)
        {
            _logger = logger;
        }

        private void ParseEMVCoQR(string qrContent, BankAccountInfo bankInfo)
        {
            _logger.LogInformation($"🔍 Parsing VietQR content: {qrContent}");

            int index = 0;
            while (index < qrContent.Length - 3)
            {
                string tag = qrContent.Substring(index, 2);
                string lengthStr = qrContent.Substring(index + 2, 2);

                if (!int.TryParse(lengthStr, out int length) || index + 4 + length > qrContent.Length)
                    break;

                string value = qrContent.Substring(index + 4, length);

                _logger.LogInformation($"🏷️ Tag: {tag}, Length: {length}, Value: {value}");

                switch (tag)
                {
                    case "00": // Payload Format Indicator
                        _logger.LogInformation("📄 Payload Format: " + value);
                        break;
                    case "01": // Point of Initiation Method
                        _logger.LogInformation("🎯 Point of Initiation: " + value);
                        break;
                    case "26": // Merchant Account Information
                        _logger.LogInformation("🏦 Merchant Account Info: " + value);
                        ParseMerchantInfo(value, bankInfo);
                        break;
                    case "52": // Merchant Category Code
                        _logger.LogInformation("📊 Merchant Category: " + value);
                        break;
                    case "53": // Transaction Currency
                        _logger.LogInformation("💰 Currency: " + value);
                        break;
                    case "54": // Transaction Amount
                        if (decimal.TryParse(value, out decimal amount))
                        {
                            _logger.LogInformation($"💵 Amount: {amount / 100} VND");
                        }
                        break;
                    case "58": // Country Code
                        _logger.LogInformation("🇻🇳 Country: " + value);
                        break;
                    case "59": // Merchant Name
                        bankInfo.AccountName = value;
                        _logger.LogInformation("👤 Merchant Name: " + value);
                        break;
                    case "60": // Merchant City
                        _logger.LogInformation("🏙️ City: " + value);
                        break;
                    case "62": // Additional Data Field
                        _logger.LogInformation("📋 Additional Data: " + value);
                        ParseAdditionalData(value, bankInfo);
                        break;
                }

                index += 4 + length;
            }
        }
        private void ParseAdditionalData(string additionalData, BankAccountInfo bankInfo)
        {
            _logger.LogInformation($"🔍 Parsing Additional Data: {additionalData}");

            int subIndex = 0;
            while (subIndex < additionalData.Length - 3)
            {
                string subTag = additionalData.Substring(subIndex, 2);
                string subLengthStr = additionalData.Substring(subIndex + 2, 2);

                if (!int.TryParse(subLengthStr, out int subLength) || subIndex + 4 + subLength > additionalData.Length)
                    break;

                string subValue = additionalData.Substring(subIndex + 4, subLength);

                _logger.LogInformation($"🔹 SubTag: {subTag}, Value: {subValue}");

                // Store ID or reference number might contain account info
                if (subTag == "08") // Store ID / Reference
                {
                    _logger.LogInformation($"🏷️ Store/Reference: {subValue}");
                    // Sometimes account number is in reference field
                    if (string.IsNullOrEmpty(bankInfo.AccountNumber) && subValue.Length >= 8)
                    {
                        bankInfo.AccountNumber = subValue;
                    }
                }

                subIndex += 4 + subLength;
            }
        }
        public BankAccountInfo ParseVietQRContent(string qrContent)
        {
            var bankInfo = new BankAccountInfo();

            if (string.IsNullOrEmpty(qrContent))
                return bankInfo;

            try
            {
                _logger.LogInformation($"Parsing QR content: {qrContent}");

                // Handle VietQR format (EMVCo standard)
                if (qrContent.StartsWith("000201"))
                {
                    ParseEMVCoQR(qrContent, bankInfo);
                }
                // Handle Napas 247 format
                else if (qrContent.Contains("napas247") || qrContent.Contains("api.napas247.com.vn"))
                {
                    ParseNapas247QR(qrContent, bankInfo);
                }
                // Handle bank-specific QR formats
                else if (qrContent.Contains("://"))
                {
                    ParseDeepLinkQR(qrContent, bankInfo);
                }
                // Handle simple account number format
                else
                {
                    ParseSimpleQR(qrContent, bankInfo);
                }

                _logger.LogInformation($"Parsed bank info: Account={bankInfo.AccountNumber}, Bank={bankInfo.BankCode}, Name={bankInfo.AccountName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing QR content: {Content}", qrContent);
            }

            return bankInfo;
        }

        private void ParseNapas247QR(string qrContent, BankAccountInfo bankInfo)
        {
            try
            {
                var uri = new Uri(qrContent);
                var query = System.Web.HttpUtility.ParseQueryString(uri.Query);

                // Napas 247 common parameters
                bankInfo.AccountNumber = query["a"] ?? query["account"] ?? query["acc"];
                bankInfo.AccountName = query["n"] ?? query["name"] ?? query["accountName"];
                bankInfo.BankCode = query["b"] ?? query["bank"] ?? query["bankCode"];

                // If bank code not found, try to extract from URL
                if (string.IsNullOrEmpty(bankInfo.BankCode))
                {
                    bankInfo.BankCode = ExtractBankCodeFromNapasUrl(uri.Host);
                }

                // Log for debugging
                _logger.LogInformation($"Napas247 QR parsed - Account: {bankInfo.AccountNumber}, Name: {bankInfo.AccountName}, Bank: {bankInfo.BankCode}");
            }
            catch (UriFormatException ex)
            {
                _logger.LogWarning($"Invalid Napas247 QR format: {qrContent}");
                ParseSimpleQR(qrContent, bankInfo);
            }
        }

        private string ExtractBankCodeFromNapasUrl(string host)
        {
            var bankDomains = new Dictionary<string, string>
    {
        { "vietcombank", "VCB" },
        { "bidv", "BIDV" },
        { "techcombank", "TCB" },
        { "mbbank", "MB" },
        { "acb", "ACB" },
        { "vib", "VIB" },
        { "vpbank", "VPB" },
        { "tpbank", "TPB" },
        { "sacombank", "STB" },
        { "scb", "SCB" },
        { "hdbank", "HDB" },
        { "ocb", "OCB" },
        { "msb", "MSB" }
    };

            foreach (var bank in bankDomains)
            {
                if (host.Contains(bank.Key))
                    return bank.Value;
            }

            return null;
        }

        private void ParseMerchantInfo(string merchantInfo, BankAccountInfo bankInfo)
        {
            _logger.LogInformation($"🔍 Parsing Merchant Info: {merchantInfo}");

            int subIndex = 0;
            while (subIndex < merchantInfo.Length - 3)
            {
                string subTag = merchantInfo.Substring(subIndex, 2);
                string subLengthStr = merchantInfo.Substring(subIndex + 2, 2);

                if (!int.TryParse(subLengthStr, out int subLength) || subIndex + 4 + subLength > merchantInfo.Length)
                    break;

                string subValue = merchantInfo.Substring(subIndex + 4, subLength);

                _logger.LogInformation($"🔸 Merchant SubTag: {subTag}, Value: {subValue}");

                if (subTag == "00") // GUID - Bank identifier
                {
                    bankInfo.BankCode = GetBankCodeFromGUID(subValue);
                    _logger.LogInformation($"🏦 Bank GUID: {subValue} -> {bankInfo.BankCode}");
                }
                else if (subTag == "01") // Account number
                {
                    bankInfo.AccountNumber = subValue;
                    _logger.LogInformation($"📞 Account Number: {subValue}");
                }
                else if (subTag == "02") // Merchant ID/Name
                {
                    if (string.IsNullOrEmpty(bankInfo.AccountName))
                    {
                        bankInfo.AccountName = subValue;
                        _logger.LogInformation($"👤 Merchant ID/Name: {subValue}");
                    }
                }

                subIndex += 4 + subLength;
            }
        }

        private void ParseDeepLinkQR(string qrContent, BankAccountInfo bankInfo)
        {
            try
            {
                var uri = new Uri(qrContent);
                var query = System.Web.HttpUtility.ParseQueryString(uri.Query);

                bankInfo.AccountNumber = query["account"]
                                      ?? query["acc"]
                                      ?? query["accountNumber"]
                                      ?? query["so_tai_khoan"];

                bankInfo.AccountName = query["accountName"]
                                    ?? query["name"]
                                    ?? query["ten_tai_khoan"];

                bankInfo.BankCode = query["bank"]
                                 ?? query["bankCode"]
                                 ?? query["ngan_hang"];

                if (string.IsNullOrEmpty(bankInfo.BankCode))
                {
                    bankInfo.BankCode = ExtractBankCodeFromUrl(uri.Host);
                }
            }
            catch (UriFormatException)
            {
                ParseSimpleQR(qrContent, bankInfo);
            }
        }

        private string ExtractBankCodeFromUrl(string host)
        {
            var bankDomains = new Dictionary<string, string>
            {
                { "vietcombank", "VCB" },
                { "bidv", "BIDV" },
                { "techcombank", "TCB" },
                { "mbbank", "MB" },
                { "acb", "ACB" },
                { "vib", "VIB" },
                { "vpbank", "VPB" },
                { "tpbank", "TPB" }
            };

            foreach (var bank in bankDomains)
            {
                if (host.Contains(bank.Key))
                    return bank.Value;
            }

            return null;
        }

        private void ParseSimpleQR(string qrContent, BankAccountInfo bankInfo)
        {
            if (qrContent.Contains('|'))
            {
                var parts = qrContent.Split('|');
                bankInfo.AccountNumber = parts[0];
                if (parts.Length > 1) bankInfo.BankCode = parts[1];
            }
            else if (qrContent.Length >= 8 && qrContent.Length <= 16)
            {
                bankInfo.AccountNumber = qrContent;
            }
        }

        private string GetBankCodeFromGUID(string guid)
        {
            var bankMapping = new Dictionary<string, string>
            {
                { "A000000727", "VCB" }, { "A000000763", "BIDV" }, { "A000000794", "TCB" },
                { "A000000847", "MB" },  { "A000000864", "ACB" },  { "A000000868", "VPB" },
                { "A000000810", "VIB" }, { "A000000823", "TPB" },  { "A000000826", "MSB" }
            };

            return bankMapping.GetValueOrDefault(guid, "VCB");
        }

        public async Task<BankAccountInfo> ScanBankQRAsync()
        {
            return await Task.FromResult<BankAccountInfo>(null);
        }

        public async Task<BankAccountInfo> DecodeQRFromStream(Stream stream)
        {
            try
            {
                if (stream.CanSeek)
                    stream.Position = 0;

                using var image = await SixLabors.ImageSharp.Image.LoadAsync<Rgba32>(stream);
                _logger.LogInformation($"📏 Image dimensions: {image.Width}x{image.Height}");

                var imageBytes = new byte[image.Width * image.Height * 4];

                image.ProcessPixelRows(accessor =>
                {
                    for (int y = 0; y < accessor.Height; y++)
                    {
                        var row = accessor.GetRowSpan(y);
                        for (int x = 0; x < row.Length; x++)
                        {
                            var pixel = row[x];
                            int index = (y * image.Width + x) * 4;
                            imageBytes[index] = pixel.R;
                            imageBytes[index + 1] = pixel.G;
                            imageBytes[index + 2] = pixel.B;
                            imageBytes[index + 3] = pixel.A;
                        }
                    }
                });

                var luminanceSource = new RGBLuminanceSource(imageBytes, image.Width, image.Height, RGBLuminanceSource.BitmapFormat.RGBA32);

                var binaryBitmap = new BinaryBitmap(new ZXing.Common.HybridBinarizer(luminanceSource));
                var reader = new QRCodeReader();
                var result = reader.decode(binaryBitmap);

                if (result == null)
                {
                    _logger.LogWarning("❌ No QR code detected");
                    return new BankAccountInfo();
                }

                _logger.LogInformation($"✅ QR Code decoded: {result.Text}");
                return ParseVietQRContent(result.Text);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error decoding QR from stream");
                return new BankAccountInfo();
            }
        }


        private byte[] ConvertBitmapToBytes(System.Drawing.Bitmap bitmap)
        {
            using var memoryStream = new MemoryStream();
            bitmap.Save(memoryStream, System.Drawing.Imaging.ImageFormat.Png);
            return memoryStream.ToArray();
        }
    }
}