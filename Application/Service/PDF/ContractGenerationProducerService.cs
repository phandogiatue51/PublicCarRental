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

        public async Task PublishContractGenerationAsync(int contractId, string renterEmail, string renterName, string staffName, bool includeStaffSignature = false)
        {
            var contractEvent = new ContractGenerationEvent
            {
                ContractId = contractId,
                RenterEmail = renterEmail,
                RenterName = renterName,
                IncludeStaffSignature = includeStaffSignature,
                StaffName = staffName
            };

            await _messageProducer.PublishMessageAsync(contractEvent, _queueName);
        }
    }
}
