using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using PublicCarRental.Application.DTOs.Message;
using SendGrid;
using SendGrid.Helpers.Mail;
using EmailAddress = SendGrid.Helpers.Mail.EmailAddress;
using EmailMessage = PublicCarRental.Application.DTOs.Message.EmailMessage;
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
                var subject = message.Subject;

                // Extract HTML body from MimeMessage
                string htmlContent = "Please view this email in an HTML-compatible email client.";
                if (message.Body is TextPart textPart)
                {
                    htmlContent = textPart.Text;
                }
                else if (message.Body is Multipart multipart)
                {
                    foreach (var part in multipart)
                    {
                        if (part is TextPart htmlPart && htmlPart.IsHtml)
                        {
                            htmlContent = htmlPart.Text;
                            break;
                        }
                    }
                }

                var msg = new SendGridMessage()
                {
                    From = new EmailAddress(fromEmail, fromName),
                    Subject = subject,
                    PlainTextContent = "Please view this email in an HTML-compatible email client.",
                    HtmlContent = htmlContent
                };
                msg.AddTo(new EmailAddress(toEmail));

                // Handle attachments
                if (message.Body is Multipart multipartWithAttachments)
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
            var subject = $"Your Rental Contract #{contractId}";
            var body = $"""
                <h2>Dear {renterName},</h2>
                <p>Your vehicle rental contract has been generated successfully.</p>
                <p>Contract ID: <strong>#{contractId}</strong></p>
                <p>Please find your contract attached.</p>
                <br>
                <p>Best regards,<br>Public Car Rental Team</p>
                """;

            var emailMessage = new EmailMessage
            {
                ToEmail = toEmail,
                Subject = subject,
                Body = body,
                IsHtml = true,
                Attachments = new List<EmailAttachment>
                {
                    new EmailAttachment
                    {
                        FileName = $"contract-{contractId}.pdf",
                        Content = pdfBytes,
                        ContentType = "application/pdf"
                    }
                }
            };

            await SendAttachment(emailMessage);
        }

        public async Task SendReceiptPdfAsync(string toEmail, string renterName, byte[] pdfBytes, int invoiceId)
        {
            var subject = $"Payment Receipt - Invoice #{invoiceId}";
            var body = $"""
            <h2>Dear {renterName},</h2>
            <p>Thank you for your payment! Your booking has been confirmed.</p>
            <p>Invoice ID: <strong>#{invoiceId}</strong></p>
            <p>Please find your payment receipt attached.</p>
            <p><strong>Important:</strong> Please bring this receipt when picking up your vehicle.</p>
            <br>
            <p>Best regards,<br>Public Car Rental Team</p>
            """;

            var emailMessage = new EmailMessage
            {
                ToEmail = toEmail,
                Subject = subject,
                Body = body,
                IsHtml = true,
                Attachments = new List<EmailAttachment>
                {
                    new EmailAttachment
                    {
                        FileName = $"receipt-{invoiceId}.pdf",
                        Content = pdfBytes,
                        ContentType = "application/pdf"
                    }
                }
            };

            await SendAttachment(emailMessage);
        }
    }

    public interface IEmailService
    {
        Task SendVerificationEmail(string toEmail, string token);
        Task SendPasswordResetEmail(string toEmail, string token);
        Task SendEmail(string toEmail, string subject, string body);
        Task SendContractPdfAsync(string toEmail, string renterName, byte[] pdfBytes, int contractId);
        Task SendReceiptPdfAsync(string toEmail, string renterName, byte[] pdfBytes, int invoiceId);
    }
}