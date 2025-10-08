using RabbitMQ.Client;

namespace PublicCarRental.Application.Service.Rabbit
{
    public interface IRabbitMQConnection
    {
        Task<IChannel> CreateChannelAsync();
        void Dispose();
    }

    public class RabbitMQConnection : IRabbitMQConnection, IDisposable
    {
        private readonly IConnection _connection;
        private readonly ILogger<RabbitMQConnection> _logger;

        public RabbitMQConnection(string connectionString, ILogger<RabbitMQConnection> logger)
        {
            _logger = logger;
            try
            {
                var factory = new ConnectionFactory
                {
                    Uri = new Uri(connectionString)
                };

                _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
                _logger.LogInformation("RabbitMQ connection established");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create RabbitMQ connection");
                throw;
            }
        }

        public async Task<IChannel> CreateChannelAsync()
        {
            return await _connection.CreateChannelAsync();
        }

        public void Dispose()
        {
            _connection?.CloseAsync();
            _connection?.Dispose();
        }
    }
}