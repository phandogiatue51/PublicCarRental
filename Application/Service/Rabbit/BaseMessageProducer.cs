using PublicCarRental.Application.Service.Rabbit;
using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

public class BaseMessageProducer
{
    private readonly IRabbitMQConnection _connection;
    private readonly ILogger<BaseMessageProducer> _logger;

    public BaseMessageProducer(IRabbitMQConnection connection, ILogger<BaseMessageProducer> logger)
    {
        _connection = connection;
        _logger = logger;
    }

    public async Task PublishMessageAsync<T>(T message, string queueName) 
    {
        try
        {
            using var channel = await _connection.CreateChannelAsync();

            await channel.QueueDeclarePassiveAsync(queueName);

            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));

            var properties = new BasicProperties();
            properties.Persistent = true;

            await channel.BasicPublishAsync(
                exchange: "",
                routingKey: queueName,
                mandatory: false,
                basicProperties: properties,
                body: body
            );

            _logger.LogInformation("Message published to {QueueName}", queueName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing message to {QueueName}", queueName);
            throw;
        }
    }
}