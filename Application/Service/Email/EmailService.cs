using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using SendGrid;
using SendGrid.Helpers.Mail;
using EmailAddress = SendGrid.Helpers.Mail.EmailAddress;
using Task = System.Threading.Tasks.Task;

namespace PublicCarRental.Application.Service.Email
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;
        private readonly ISendGridClient _sendGridClient;

        public EmailService(IConfiguration config, ILogger<EmailService> logger, ISendGridClient sendGridClient = null)
        {
            _config = config;
            _logger = logger;
            _sendGridClient = sendGridClient;
        }

        private async Task<bool> SendEmailAsync(Func<MimeMessage> createMessage, int maxRetries = 2)
        {
            // Try SMTP first
            var smtpSuccess = await TrySendViaSmtpAsync(createMessage, maxRetries);
            if (smtpSuccess)
            {
                _logger.LogInformation("✅ Email sent successfully via SMTP");
                return true;
            }

            // Fall back to SendGrid API if SMTP fails
            if (_sendGridClient != null)
            {
                _logger.LogInformation("🔄 SMTP failed, trying SendGrid API...");
                var apiSuccess = await TrySendViaSendGridApiAsync(createMessage);
                if (apiSuccess)
                {
                    _logger.LogInformation("✅ Email sent successfully via SendGrid API");
                    return true;
                }
            }

            _logger.LogError("❌ All email delivery methods failed");
            return false;
        }

        private async Task<bool> TrySendViaSmtpAsync(Func<MimeMessage> createMessage, int maxRetries)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"] ?? "587");
            var username = _config["EmailSettings:Username"];
            var password = _config["EmailSettings:Password"];

            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                using var client = new SmtpClient();
                try
                {
                    _logger.LogInformation("📧 SMTP Attempt {Attempt} - Connecting to {Server}:{Port}",
                        attempt + 1, smtpServer, port);

                    client.Timeout = 30000;

                    await client.ConnectAsync(smtpServer, port, SecureSocketOptions.StartTls);
                    _logger.LogInformation("✅ SMTP Connected");

                    await client.AuthenticateAsync(username, password);
                    _logger.LogInformation("✅ SMTP Authenticated");

                    var message = createMessage();
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);

                    return true;
                }
                catch (TimeoutException ex)
                {
                    _logger.LogWarning("⏰ SMTP timeout on attempt {Attempt}", attempt + 1);
                    if (attempt == maxRetries - 1) return false;

                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("❌ SMTP error on attempt {Attempt}: {Message}", attempt + 1, ex.Message);
                    if (attempt == maxRetries - 1) return false;

                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)));
                }
                finally
                {
                    if (client.IsConnected)
                        await client.DisconnectAsync(true);
                }
            }
            return false;
        }

        private async Task<bool> TrySendViaSendGridApiAsync(Func<MimeMessage> createMessage)
        {
            try
            {
                var message = createMessage();

                var fromEmail = _config["EmailSettings:SenderEmail"];
                var fromName = _config["EmailSettings:SenderName"];
                var toEmail = message.To.Mailboxes.FirstOrDefault()?.Address;
                var toName = message.To.Mailboxes.FirstOrDefault()?.Name;
                var subject = message.Subject;

                // Extract HTML and plain text content
                string htmlContent = "Please view this email in an HTML-compatible email client.";
                string plainTextContent = "Please view this email in an HTML-compatible email client.";

                if (message.Body is TextPart singleTextPart)
                {
                    if (singleTextPart.IsHtml)
                        htmlContent = singleTextPart.Text;
                    else
                        plainTextContent = singleTextPart.Text;
                }
                else if (message.Body is MimeKit.Multipart multipart)
                {
                    foreach (var part in multipart)
                    {
                        if (part is TextPart htmlPart && htmlPart.IsHtml)
                        {
                            htmlContent = htmlPart.Text;
                        }
                        else if (part is TextPart textPartContent)
                        {
                            plainTextContent = textPartContent.Text;
                        }
                    }
                }

                var msg = new SendGridMessage()
                {
                    From = new EmailAddress(fromEmail, fromName),
                    Subject = subject,
                    PlainTextContent = plainTextContent,
                    HtmlContent = htmlContent
                };

                msg.AddTo(new EmailAddress(toEmail, toName));

                // Critical: Disable tracking for transactional emails
                msg.SetClickTracking(false, false);
                msg.SetOpenTracking(false);
                msg.SetAsm(0);

                // Handle attachments
                if (message.Body is MimeKit.Multipart multipartWithAttachments)
                {
                    foreach (var part in multipartWithAttachments)
                    {
                        if (part is MimePart attachment && attachment.IsAttachment)
                        {
                            using var stream = new MemoryStream();
                            await attachment.Content.DecodeToAsync(stream);
                            var fileBytes = stream.ToArray();
                            var fileName = attachment.FileName;

                            msg.AddAttachment(fileName, Convert.ToBase64String(fileBytes));
                        }
                    }
                }

                var response = await _sendGridClient.SendEmailAsync(msg);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("✅ SendGrid API: Email sent to {ToEmail}", toEmail);
                    return true;
                }
                else
                {
                    var error = await response.Body.ReadAsStringAsync();
                    _logger.LogError("❌ SendGrid API error: {StatusCode} - {Error}",
                        response.StatusCode, error);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ SendGrid API failed");
                return false;
            }
        }

        public async Task SendVerificationEmail(string toEmail, string token)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];

            MimeMessage CreateMessage()
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = "Verify your email";

                var verificationLink = $"https://publiccarrental-production-b7c5.up.railway.app/api/Account/verify-email?token={token}";

                message.Body = new TextPart("html")
                {
                    Text = $@"
                    <html>
                      <body style='font-family: Arial, sans-serif; color: #333;'>
                        <div style='max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                          <h2 style='color: #007bff;'>Welcome to PublicCarRental!</h2>
                          <p>Hi {toEmail},</p>
                          <p>Thanks for registering. Please verify your email by clicking the button below:</p>
                          <a href='{verificationLink}' 
                             style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>
                             Verify Email
                          </a>
                          <p style='margin-top: 20px;'>If you didn't request this, you can safely ignore it.</p>
                          <p>— PublicCarRental Team</p>
                        </div>
                      </body>
                    </html>"
                };
                return message;
            }

            await SendEmailAsync(CreateMessage);
        }

        public async Task SendPasswordResetEmail(string toEmail, string token)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];

            MimeMessage CreateMessage()
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = "Reset your password";

                var resetLink = $"https://publiccarrental-production-b7c5.up.railway.app/api/Account/reset-password?token={token}";

                message.Body = new TextPart("html")
                {
                    Text = $@"
            <html>
              <body style='font-family: Arial, sans-serif; color: #333;'>
                <div style='max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>
                  <h2 style='color: #dc3545;'>Password Reset Request</h2>
                  <p>Hi {toEmail},</p>
                  <p>We received a request to reset your password. Click the button below to proceed:</p>
                  <a href='{resetLink}' 
                     style='display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;'>
                     Reset Password
                  </a>
                  <p style='margin-top: 20px;'>If you didn't request this, you can safely ignore it.</p>
                  <p>— PublicCarRental Team</p>
                </div>
              </body>
            </html>"
                };
                return message;
            }

            await SendEmailAsync(CreateMessage);
        }

        public async Task SendEmail(string toEmail, string subject, string body)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];

            MimeMessage CreateMessage()
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;
                message.Body = new TextPart("html") { Text = body };
                return message;
            }

            await SendEmailAsync(CreateMessage);
        }

        public async Task SendAttachment(DTOs.Message.EmailMessage emailMessage)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];

            MimeMessage CreateMessage()
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress("", emailMessage.ToEmail));
                message.Subject = emailMessage.Subject;

                var bodyBuilder = new BodyBuilder();

                if (emailMessage.IsHtml)
                {
                    bodyBuilder.HtmlBody = emailMessage.Body;
                }
                else
                {
                    bodyBuilder.TextBody = emailMessage.Body;
                }

                foreach (var attachment in emailMessage.Attachments)
                {
                    bodyBuilder.Attachments.Add(attachment.FileName, attachment.Content,
                        ContentType.Parse(attachment.ContentType));
                }

                message.Body = bodyBuilder.ToMessageBody();
                return message;
            }

            await SendEmailAsync(CreateMessage);
        }

        public async Task SendContractPdfAsync(string toEmail, string renterName, byte[] pdfBytes, int contractId)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];

            MimeMessage CreateMessage()
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress(renterName, toEmail));

                message.Subject = $"Your Rental Contract - Contract #{contractId}";

                var bodyBuilder = new BodyBuilder();

                bodyBuilder.HtmlBody = BuildContractHtmlContent(renterName, contractId);

                bodyBuilder.TextBody = BuildContractPlainTextContent(renterName, contractId);

                bodyBuilder.Attachments.Add($"contract-{contractId}.pdf", pdfBytes, ContentType.Parse("application/pdf"));

                message.Body = bodyBuilder.ToMessageBody();
                return message;
            }

            await SendEmailAsync(CreateMessage);
        }

        private string BuildContractPlainTextContent(string renterName, int contractId)
        {
            return $"""
                CAR777 - RENTAL CONTRACT

                Dear {renterName},

                Your vehicle rental contract has been made.

                CONTRACT NUMBER: #{contractId}

                Your rental contract is attached to this email.

                IMPORTANT NEXT STEPS:
                1. Review the contract terms and conditions.
                2. Keep this receipt for your records.
                3. Ensure the vehicle is returned on time and in good condition.
                4. Contact our support line at 0901 697 330 immediately if you experience any issues during your rental.
             
                If you have any questions about your contract, please contact us at publiccarrental987@gmail.com

                Best regards,
                Car777 Team

                ---
                This is an automated contract document. Please do not reply to this message.
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
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
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
            
                    <p>Your rental contract is attached to this email.</p>
            
                    <div class="steps">
                        <p><strong>Important Next Steps:</strong></p>
                        <ul>
                            <li>Review the contract terms and conditions</li>
                            <li>Keep this receipt for your records</li>
                            <li>Ensure the vehicle is returned on time and in good condition</li>
                            <li>Contact our support line at 0901 697 330 immediately if you experience any issues during your rental</li>
                        </ul>
                    </div>
                </div>
        
                <div class="footer">
                    <p><strong>Car777 Team</strong><br>
                    publiccarrental987@gmail.com</p>
            
                    <p style="margin-top: 15px; color: #9ca3af;">
                        This is an automated contract document for your rental agreement.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            </body>
            </html>
            """;
        }
        public async Task SendReceiptPdfAsync(string toEmail, string userName, byte[] pdfBytes, int invoiceId)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];

            MimeMessage CreateMessage()
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress(userName, toEmail));

                message.Subject = $"Your Car Rental Receipt - Invoice #{invoiceId}";

                var bodyBuilder = new BodyBuilder();

                bodyBuilder.HtmlBody = BuildReceiptHtmlContent(userName, invoiceId);

                bodyBuilder.TextBody = BuildReceiptPlainTextContent(userName, invoiceId);

                bodyBuilder.Attachments.Add($"receipt-{invoiceId}.pdf", pdfBytes, ContentType.Parse("application/pdf"));

                message.Body = bodyBuilder.ToMessageBody();
                return message;
            }

            await SendEmailAsync(CreateMessage);
        }

        private string BuildReceiptPlainTextContent(string userName, int invoiceId)
        {
            return $"""
            CAR777 - PAYMENT CONFIRMATION
    
            Dear {userName},
    
            Thank you for your payment. Your vehicle booking has been confirmed.
    
            INVOICE NUMBER: #{invoiceId}
    
            Your payment receipt is attached to this email.
    
            VEHICLE PICKUP:
            Please bring this receipt, your driver's license and identity card when picking up your vehicle.
    
            If you have any questions about your booking, please contact us at publiccarrental987@gmail.com
    
            Best regards,
            Car777 Team
    
            ---
            This is an automated transaction receipt. Please do not reply to this message.
            """;
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
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
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
            
                    <p>Your payment receipt is attached to this email.</p>
            
                    <p><strong>Vehicle Pickup Instructions:</strong><br>
                    Please bring this receipt, your valid driver's license and identity card when picking up your vehicle.</p>
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
    }

    public interface IEmailService
    {
        Task SendVerificationEmail(string toEmail, string token);
        Task SendPasswordResetEmail(string toEmail, string token);
        Task SendEmail(string toEmail, string subject, string body);
        Task SendContractPdfAsync(string toEmail, string renterName, byte[] pdfBytes, int contractId);
        Task SendReceiptPdfAsync(string toEmail, string userName, byte[] pdfBytes, int invoiceId);
    }
}