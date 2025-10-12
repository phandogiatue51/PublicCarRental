using Microsoft.Extensions.Options;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Models.Configuration;
using PublicCarRental.Infrastructure.Data.Repository.Vehi;

public class AccidentEventProducerService
{
    private readonly BaseMessageProducer _messageProducer;
    private readonly RabbitMQSettings _rabbitMqSettings;
    private readonly ILogger<AccidentEventProducerService> _logger;
    private readonly IVehicleRepository _vehicleRepository;

    public AccidentEventProducerService(
        BaseMessageProducer messageProducer,
        IOptions<RabbitMQSettings> rabbitMqSettings,
        IVehicleRepository vehicleRepository,
        ILogger<AccidentEventProducerService> logger)
    {
        _messageProducer = messageProducer;
        _rabbitMqSettings = rabbitMqSettings.Value;
        _vehicleRepository = vehicleRepository;
        _logger = logger;
    }

    public async Task PublishAccidentReportedAsync(AccidentReport accident)
    {
        var vehicle = _vehicleRepository.GetById(accident.VehicleId);

        var accidentEvent = new AccidentReportedEvent
        {
            AccidentId = accident.AccidentId,
            ContractId = accident.ContractId,
            VehicleId = accident.VehicleId,
            StaffId = accident.StaffId,
            Description = accident.Description,
            Location = accident.Location,
            ReportedAt = accident.ReportedAt,
            ImageUrl = accident.ImageUrl,
            VehicleLicensePlate = vehicle?.LicensePlate ?? "Unknown"
        };

        await _messageProducer.PublishMessageAsync(
            accidentEvent,
            _rabbitMqSettings.QueueNames.AccidentQueue
        );

        _logger.LogInformation("AccidentReported event published to {QueueName} for accident {AccidentId}",
            _rabbitMqSettings.QueueNames.AccidentQueue, accident.AccidentId);
    }
}