using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using PublicCarRental.Application.DTOs.Message;
using System.Net;

namespace PublicCarRental.Application.Service.Email
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        private async Task<bool> SendEmailAsync(Func<MimeMessage> createMessage, int maxRetries = 3)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"] ?? "587");
            var username = _config["EmailSettings:Username"];
            var password = _config["EmailSettings:Password"];
            var useSsl = bool.Parse(_config["EmailSettings:UseSsl"] ?? "false");

            // For SendGrid specific settings
            var isSendGrid = smtpServer?.Contains("sendgrid", StringComparison.OrdinalIgnoreCase) == true;

            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                using var client = new SmtpClient();
                
                try
                {
                    // Configure timeout and SSL
                    client.Timeout = 30000; // 30 seconds
                    
                    // SendGrid specific configuration
                    if (isSendGrid)
                    {
                        _logger.LogInformation($"Attempt {attempt + 1} to connect to SendGrid SMTP: {smtpServer}:{port}");
                        // SendGrid uses STARTTLS on port 587
                        await client.ConnectAsync(smtpServer, port, MailKit.Security.SecureSocketOptions.StartTls);
                    }
                    else
                    {
                        var secureSocketOptions = useSsl ? MailKit.Security.SecureSocketOptions.StartTls : MailKit.Security.SecureSocketOptions.None;
                        await client.ConnectAsync(smtpServer, port, secureSocketOptions);
                    }
                    
                    // Disable server certificate validation for development (be careful in production)
                    client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                    
                    await client.AuthenticateAsync(username, password);
                    
                    var message = createMessage();
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                    
                    _logger.LogInformation($"Email sent successfully on attempt {attempt + 1}");
                    return true;
                }
                catch (TimeoutException ex)
                {
                    _logger.LogWarning(ex, $"SMTP timeout on attempt {attempt + 1} to {smtpServer}:{port}");
                    if (attempt == maxRetries - 1) 
                    {
                        _logger.LogError($"All {maxRetries} attempts failed due to timeout");
                        throw;
                    }
                    
                    var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                    _logger.LogInformation($"Retrying in {delay.TotalSeconds} seconds...");
                    await Task.Delay(delay);
                }
              
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to send email on attempt {attempt + 1}");
                    if (attempt == maxRetries - 1) throw;
                    
                    var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                    await Task.Delay(delay);
                }
                finally
                {
                    if (client.IsConnected)
                    {
                        await client.DisconnectAsync(true);
                    }
                }
            }
            return false;
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

        public async Task SendAttachment(EmailMessage emailMessage)
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