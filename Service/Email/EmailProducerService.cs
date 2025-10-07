// Services/Email/EmailProducerService.cs
using Microsoft.Extensions.Options;
using PublicCarRental.DTOs;
using PublicCarRental.DTOs.Message;
using PublicCarRental.Models.Configuration;

namespace PublicCarRental.Service.Email
{
    public class EmailProducerService
    {
        private readonly BaseMessageProducer _messageProducer;
        private readonly IOptions<RabbitMQSettings> _rabbitMqSettings;
        private readonly ILogger<EmailProducerService> _logger;

        public EmailProducerService(
            BaseMessageProducer messageProducer,
            IOptions<RabbitMQSettings> rabbitMqSettings,
            ILogger<EmailProducerService> logger)
        {
            _messageProducer = messageProducer;
            _rabbitMqSettings = rabbitMqSettings;
            _logger = logger;
        }

        public async Task QueueVerificationEmailAsync(string toEmail, string token)
        {
            var verificationLink = $"https://publiccarrental-production-b7c5.up.railway.app/api/Account/verify-email?token={token}";
            var message = new EmailMessage
            {
                ToEmail = toEmail,
                Subject = "Verify Your Email",
                Body = $@"<h2>Welcome to PublicCarRental!</h2><p>Click <a href='{verificationLink}'>here</a> to verify your email.</p>",
                MessageType = "Verification",
                Token = token
            };

            await _messageProducer.PublishMessageAsync(message, _rabbitMqSettings.Value.QueueNames.EmailQueue);
            _logger.LogInformation("Verification email queued for {Email}", toEmail);
        }

        public async Task QueuePasswordResetEmailAsync(string toEmail, string token)
        {
            var resetLink = $"https://publiccarrental-production-b7c5.up.railway.app/api/Account/reset-password?token={token}";
            var message = new EmailMessage
            {
                ToEmail = toEmail,
                Subject = "Reset Your Password",
                Body = $@"<h2>Password Reset Request</h2><p>Click <a href='{resetLink}'>here</a> to reset your password.</p>",
                MessageType = "PasswordReset",
                Token = token
            };

            await _messageProducer.PublishMessageAsync(message, _rabbitMqSettings.Value.QueueNames.EmailQueue);
            _logger.LogInformation("Password reset email queued for {Email}", toEmail);
        }

        public async Task SendStaffNotificationAsync(EmailMessage message)
        {
            await _messageProducer.PublishMessageAsync(message, _rabbitMqSettings.Value.QueueNames.EmailQueue);
            _logger.LogInformation("Staff notification queued for {Email}", message.ToEmail);
        }
    }
}   