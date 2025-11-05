using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PublicCarRental.Application.DTOs.Pay;
using PublicCarRental.Application.Service;
using ZXing;
using ZXing.Common;
using ZXing.QrCode;

namespace PublicCarRental.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QRScanController : ControllerBase
    {
        private readonly IQRScannerService _qrScannerService;
        private readonly ILogger<QRScanController> _logger;

        public QRScanController(IQRScannerService qrScannerService, ILogger<QRScanController> logger)
        {
            _qrScannerService = qrScannerService;
            _logger = logger;
        }

        [HttpPost("scan-upload")]
        public async Task<ActionResult<BankAccountInfo>> ScanUploadedQR(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            try
            {
                using var stream = file.OpenReadStream();

                // Use the ImageSharp approach (cross-platform)
                var bankInfo = await _qrScannerService.DecodeQRFromStream(stream);

                if (!string.IsNullOrEmpty(bankInfo.AccountNumber))
                {
                    return Ok(bankInfo);
                }

                return BadRequest("No QR code found in image");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing uploaded QR image");
                return StatusCode(500, "Error processing QR image");
            }
        }

        [HttpPost("parse-content")]
        public ActionResult<BankAccountInfo> ParseQRContent([FromBody] QRContentRequest request)
        {
            if (string.IsNullOrEmpty(request.QRContent))
                return BadRequest("QR content is required");

            var bankInfo = _qrScannerService.ParseVietQRContent(request.QRContent);
            return Ok(bankInfo);
        }
    }

    public class QRContentRequest
    {
        public string QRContent { get; set; }
    }
}