using System.Text.Json;

namespace PublicCarRental.Application.Service.Email
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public EmailService(ILogger<EmailService> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _apiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY");
        }

        public async Task SendEmail(string toEmail, string subject, string htmlBody)
        {
            await SendEmailAsync(toEmail, subject, htmlBody);
        }

        public async Task SendReceiptPdfAsync(string toEmail, string userName, byte[] pdfBytes, int invoiceId)
        {
            var htmlContent = BuildReceiptHtmlContent(userName, invoiceId);
            await SendEmailWithAttachment(toEmail, $"Your Car Rental Receipt - Invoice #{invoiceId}", htmlContent, pdfBytes, $"receipt-{invoiceId}.pdf");
        }

        public async Task SendContractPdfAsync(string toEmail, string renterName, byte[] pdfBytes, int contractId)
        {
            var htmlContent = BuildContractHtmlContent(renterName, contractId);
            await SendEmailWithAttachment(toEmail, $"Your Rental Contract - Contract #{contractId}", htmlContent, pdfBytes, $"contract-{contractId}.pdf");
        }

        private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                var payload = new
                {
                    from = "Car777 <noreply@car777.shop>", // ✅ Your verified domain!
                    to = new[] { toEmail },
                    subject = subject,
                    html = htmlBody
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
                {
                    Content = JsonContent.Create(payload)
                };

                request.Headers.Add("Authorization", $"Bearer {_apiKey}");

                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"✅ Resend: Email sent to {toEmail}");
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Resend failed: {error}");
                    throw new Exception($"Resend API error: {error}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Resend failed for {toEmail}: {ex.Message}");
                throw;
            }
        }

        private async Task SendEmailWithAttachment(string toEmail, string subject, string htmlBody, byte[] pdfBytes, string fileName)
        {
            try
            {
                var base64Pdf = Convert.ToBase64String(pdfBytes);

                var payload = new
                {
                    from = "Car777 <noreply@car777.shop>", // ✅ Your verified domain!
                    to = new[] { toEmail },
                    subject = subject,
                    html = htmlBody,
                    attachments = new[]
                    {
                        new
                        {
                            filename = fileName,
                            content = base64Pdf
                        }
                    }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
                {
                    Content = JsonContent.Create(payload)
                };

                request.Headers.Add("Authorization", $"Bearer {_apiKey}");

                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"✅ Resend: Email with PDF sent to {toEmail}");
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"❌ Resend with PDF failed: {error}");
                    throw new Exception($"Resend API error: {error}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Resend with PDF failed for {toEmail}: {ex.Message}");
                throw;
            }
        }

        public async Task SendVerificationEmail(string toEmail, string token)
        {
            var verificationLink = $"https://car777.shop/api/Account/verify-email?token={token}"; // ✅ Your domain!

            var htmlContent = $@"
                <div style='font-family: Times New Roman, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                    <h2 style='color: #007bff;'>Welcome to Car777!</h2>
                    <p>Hi {toEmail},</p>
                    <p>Thanks for registering. Please verify your email by clicking the button below:</p>
                    <a href='{verificationLink}' 
                       style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>
                       Verify Email
                    </a>
                    <p style='margin-top: 20px;'>If you didn't request this, you can safely ignore it.</p>
                    <p>— Car777 Team</p>
                </div>";

            await SendEmailAsync(toEmail, "Verify your email", htmlContent);
        }

        public async Task SendPasswordResetEmail(string toEmail, string token)
        {
            var resetLink = $"https://publiccarrental-production-b7c5.up.railway.app/api/Account/reset-password?token={token}"; // ✅ Your domain!

            var htmlContent = $@"
                <div style='font-family: Times New Roman, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                    <h2 style='color: #dc3545;'>Password Reset Request</h2>
                    <p>Hi {toEmail},</p>
                    <p>We received a request to reset your password. Click the button below to proceed:</p>
                    <a href='{resetLink}' 
                       style='display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;'>
                       Reset Password
                    </a>
                    <p style='margin-top: 20px;'>If you didn't request this, you can safely ignore it.</p>
                    <p>— Car777 Team</p>
                </div>";

            await SendEmailAsync(toEmail, "Reset your password", htmlContent);
        }

        private string BuildReceiptHtmlContent(string userName, int invoiceId)
        {
            return $$"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Times New Roman, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { color: #2563eb; text-align: center; padding: 20px 0; }
                    .content { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { color: #6b7280; font-size: 12px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; }
                    .invoice-id { background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #e5e7eb; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Car777</h2>
                    <h3>Payment Confirmation</h3>
                </div>
        
                <p>Dear <strong>{{userName}}</strong>,</p>
        
                <div class="content">
                    <p>Thank you for your payment. Your vehicle booking has been confirmed.</p>
            
                    <div class="invoice-id">Invoice ID: #{{invoiceId}}</div>
            
                    <p>Your payment receipt will be available in your account.</p>
            
                    <p><strong>Vehicle Pickup Instructions:</strong><br>
                    Please bring your valid driver's license and identity card when picking up your vehicle.</p>
                </div>
        
                <div class="footer">
                    <p><strong>Car777 Team</strong><br>
                    publiccarrental987@gmail.com</p>
            
                    <p style="margin-top: 15px; color: #9ca3af;">
                        This is an automated transaction receipt for your recent booking.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            </body>
            </html>
            """;
        }

        private string BuildContractHtmlContent(string renterName, int contractId)
        {
            return $$"""
             <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Times New Roman, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { color: #2563eb; text-align: center; padding: 20px 0; }
                    .content { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .footer { color: #6b7280; font-size: 12px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; }
                    .contract-id { background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #e5e7eb; font-weight: bold; }
                    .steps { background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>CAR777</h2>
                    <h3>Rental Contract</h3>
                </div>
        
                <p>Dear <strong>{{renterName}}</strong>,</p>
        
                <div class="content">
                    <p>Your vehicle rental contract has been made.</p>
            
                    <div class="contract-id">Contract ID: #{{contractId}}</div>
            
                    <p>Your rental contract details are confirmed.</p>
            
                    <div class="steps">
                        <p><strong>Important Next Steps:</strong></p>
                        <ul>
                            <li>Review the contract terms and conditions in your account</li>
                            <li>Keep this confirmation for your records</li>
                            <li>Ensure the vehicle is returned on time and in good condition</li>
                            <li>Contact our support line at 0901 697 330 immediately if you experience any issues during your rental</li>
                        </ul>
                    </div>
                </div>
        
                <div class="footer">
                    <p><strong>Car777 Team</strong><br>
                    publiccarrental987@gmail.com</p>
            
                    <p style="margin-top: 15px; color: #9ca3af;">
                        This is an automated contract confirmation for your rental agreement.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            </body>
            </html>
            """;
        }
    }

    public interface IEmailService
    {
        Task SendVerificationEmail(string toEmail, string token);
        Task SendPasswordResetEmail(string toEmail, string token);
        Task SendEmail(string toEmail, string subject, string body);
        Task SendReceiptPdfAsync(string toEmail, string userName, byte[] pdfBytes, int invoiceId);
        Task SendContractPdfAsync(string toEmail, string renterName, byte[] pdfBytes, int contractId);
    }
}