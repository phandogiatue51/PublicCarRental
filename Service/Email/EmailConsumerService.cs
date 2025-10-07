using PublicCarRental.DTOs.Message;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace PublicCarRental.Service.Email
{
    public class EmailConsumerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly string _connectionString;
        private readonly string _queueName;
        private readonly ILogger<EmailConsumerService> _logger;

        public EmailConsumerService(IConfiguration configuration, IServiceProvider serviceProvider, ILogger<EmailConsumerService> logger)
        {
            _serviceProvider = serviceProvider;
            _connectionString = configuration["RabbitMQ:ConnectionString"];
            _queueName = configuration["RabbitMQ:QueueNames:EmailQueue"];
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var factory = new ConnectionFactory { Uri = new Uri(_connectionString) };

            using var connection = await factory.CreateConnectionAsync();
            using var channel = await connection.CreateChannelAsync();

            await channel.QueueDeclareAsync(queue: _queueName,
                                          durable: true,
                                          exclusive: false,
                                          autoDelete: false,
                                          arguments: null);

            var consumer = new AsyncEventingBasicConsumer(channel);
            consumer.ReceivedAsync += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = JsonSerializer.Deserialize<EmailMessage>(Encoding.UTF8.GetString(body));

                    _logger.LogInformation("Processing email for {Email}", message.ToEmail);

                    using var scope = _serviceProvider.CreateScope();
                    var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                    if (message.MessageType == "Verification")
                    {
                        emailService.SendVerificationEmail(message.ToEmail, message.Token);
                        _logger.LogInformation("Verification email sent to {Email}", message.ToEmail);
                    }
                    else if (message.MessageType == "PasswordReset")
                    {
                        emailService.SendPasswordResetEmail(message.ToEmail, message.Token);
                        _logger.LogInformation("Password reset email sent to {Email}", message.ToEmail);
                    }
                    else if (message.MessageType == "StaffNotification")
                    {
                        emailService.SendEmail(message.ToEmail, message.Subject, message.Body);
                        _logger.LogInformation("Staff notification email sent to {Email}", message.ToEmail);
                    }

                    await channel.BasicAckAsync(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing email message");
                }
            };

            await channel.BasicConsumeAsync(queue: _queueName,
                                          autoAck: false,
                                          consumer: consumer);

            _logger.LogInformation("Email consumer started listening on {QueueName}", _queueName);

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
    }
}
