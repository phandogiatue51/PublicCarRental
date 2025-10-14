using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using MimeKit;
using PublicCarRental.Application.DTOs.Message;

namespace PublicCarRental.Application.Service.Email
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public void SendVerificationEmail(string toEmail, string token)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"]);
            var username = _config["EmailSettings:Username"];
            var password = _config["EmailSettings:Password"];

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
                      <p style='margin-top: 20px;'>If you didn’t request this, you can safely ignore it.</p>
                      <p>— PublicCarRental Team</p>
                    </div>
                  </body>
                </html>"
            };

            using var client = new SmtpClient();
            client.Connect(smtpServer, port, false);
            client.Authenticate(username, password);
            client.Send(message);
            client.Disconnect(true);
        }

        public void SendPasswordResetEmail(string toEmail, string token)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"]);
            var username = _config["EmailSettings:Username"];
            var password = _config["EmailSettings:Password"];

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
                      <p style='margin-top: 20px;'>If you didn’t request this, you can safely ignore it.</p>
                      <p>— PublicCarRental Team</p>
                    </div>
                  </body>
                </html>"
            };

            using var client = new SmtpClient();
            client.Connect(smtpServer, port, false);
            client.Authenticate(username, password);
            client.Send(message);
            client.Disconnect(true);
        }

        public void SendEmail(string toEmail, string subject, string body)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"]);
            var username = _config["EmailSettings:Username"];
            var password = _config["EmailSettings:Password"];

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = body };

            using var client = new SmtpClient();
            client.Connect(smtpServer, port, false);
            client.Authenticate(username, password);
            client.Send(message);
            client.Disconnect(true);
        }

        public async Task SendAttachment(EmailMessage emailMessage)
        {
            var senderName = _config["EmailSettings:SenderName"];
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"]);
            var username = _config["EmailSettings:Username"];
            var password = _config["EmailSettings:Password"];

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

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, port, false);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
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
    }
    public interface IEmailService
    {
        public void SendVerificationEmail(string toEmail, string token);
        public void SendPasswordResetEmail(string toEmail, string token);
        void SendEmail(string toEmail, string subject, string body);
        Task SendContractPdfAsync(string toEmail, string renterName, byte[] pdfBytes, int contractId);

    }
}