using PublicCarRental.Application.DTOs.Message;

namespace PublicCarRental.Application.Service.PDF
{
    public interface IContractGenerationProducerService
    {
        Task PublishContractGenerationAsync(int contractId, string renterEmail, string renterName, string staffName, bool includeStaffSignature = false);
    }

    public class ContractGenerationProducerService : IContractGenerationProducerService
    {
        private readonly BaseMessageProducer _messageProducer;
        private readonly ILogger<ContractGenerationProducerService> _logger;
        private readonly string _queueName = "contract_generation_queue";

        public ContractGenerationProducerService(BaseMessageProducer messageProducer, ILogger<ContractGenerationProducerService> logger)
        {
            _messageProducer = messageProducer;
            _logger = logger;
        }

        public async Task PublishContractGenerationAsync(int contractId, string renterEmail, string renterName, string staffName, bool includeStaffSignature = false)
        {
            try
            {
                _logger.LogInformation("📄 Publishing contract generation event for Contract {ContractId}, Renter {RenterEmail}", 
                    contractId, renterEmail);

                var contractEvent = new ContractGenerationEvent
                {
                    ContractId = contractId,
                    RenterEmail = renterEmail,
                    RenterName = renterName,
                    IncludeStaffSignature = includeStaffSignature,
                    StaffName = staffName
                };

                await _messageProducer.PublishMessageAsync(contractEvent, _queueName);
                
                _logger.LogInformation("✅ Contract generation event published successfully for Contract {ContractId}", contractId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to publish contract generation event for Contract {ContractId}", contractId);
                throw;
            }
        }
    }
}
