using Microsoft.Extensions.Options;
using PublicCarRental.Application.DTOs.Message;
using PublicCarRental.Infrastructure.Data.Models;
using PublicCarRental.Infrastructure.Data.Models.Configuration;
using PublicCarRental.Infrastructure.Data.Repository.Vehi;

namespace PublicCarRental.Application.Service.Rabbit
{
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

            _logger.LogWarning("🚨 AccidentReported event published to {QueueName} for accident {AccidentId}",
                _rabbitMqSettings.QueueNames.AccidentQueue, accident.AccidentId);
        }
        public async Task PublishVehicleReadyAsync(AccidentReport accident)
        {
            var vehicleReadyEvent = new VehicleReadyEvent
            {
                AccidentId = accident.AccidentId,
                VehicleId = accident.VehicleId,
                LicensePlate = accident.Vehicle?.LicensePlate ?? "Unknown",
                StationId = accident.Vehicle?.StationId ?? 0
            };

            await _messageProducer.PublishMessageAsync(
                vehicleReadyEvent,
                _rabbitMqSettings.QueueNames.NotificationQueue 
            );

            _logger.LogInformation("🚗 VehicleReady event published for vehicle {VehicleId} at station {StationId}",
                accident.VehicleId, accident.Vehicle?.StationId);
        }

        public async Task PublishActionMessage(AccidentReport accident)
        {
            var vehicle = _vehicleRepository.GetById(accident.VehicleId);

            var actionEvent = new AccidentActionEvent
            {
                AccidentId = accident.AccidentId,
                VehicleId = accident.VehicleId,
                Status = accident.Status,
                ActionTaken = accident.ActionTaken,
                ResolutionNote = accident.ResolutionNote,
                ResolvedAt = accident.ResolvedAt,
                VehicleLicensePlate = vehicle?.LicensePlate ?? "Unknown",
                StationId = vehicle?.StationId ?? 0, // ✅ Add station ID
                StaffId = accident.StaffId // ✅ Include reporting staff
            };

            await _messageProducer.PublishMessageAsync(
                actionEvent,
                _rabbitMqSettings.QueueNames.NotificationQueue
            );

            _logger.LogInformation("📢 Accident action event published to station {StationId}: {AccidentId} - {Status}",
                actionEvent.StationId, accident.AccidentId, accident.Status);
        }
    }
}