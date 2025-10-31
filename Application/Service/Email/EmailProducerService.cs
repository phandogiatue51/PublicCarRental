using Microsoft.Extensions.Options;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Infrastructure.Data.Models.Configuration;

namespace PublicCarRental.Application.Service.Email
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
            var verificationLink = $"https://car777.shop/Account/verify-email?token={token}";
            var message = new EmailMessage
            {
                ToEmail = toEmail,
                Subject = "Verify Your Email",
                Body = $@"<h2>Welcome to Car777!</h2><p>Click <a href='{verificationLink}'>here</a> to verify your email.</p>",
                MessageType = "Verification",
                Token = token
            };

            await _messageProducer.PublishMessageAsync(message, _rabbitMqSettings.Value.QueueNames.EmailQueue);
            _logger.LogInformation("Verification email queued for {Email}", toEmail);
        }

        public async Task QueuePasswordResetEmailAsync(string toEmail, string token)
        {
            var resetLink = $"https://car777.shop/Account/reset-password?token={token}";
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