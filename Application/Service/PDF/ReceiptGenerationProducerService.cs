using PublicCarRental.Application.DTOs.Message;

namespace PublicCarRental.Application.Service.PDF
{
    public interface IReceiptGenerationProducerService
    {
        Task PublishReceiptGenerationAsync(int invoiceId, int contractId, int renterId);
    }

    public class ReceiptGenerationProducerService : IReceiptGenerationProducerService
    {
        private readonly BaseMessageProducer _messageProducer;
        private readonly ILogger<ReceiptGenerationProducerService> _logger;
        private readonly string _queueName = "receipt_generation_queue";

        public ReceiptGenerationProducerService(BaseMessageProducer messageProducer, ILogger<ReceiptGenerationProducerService> logger)
        {
            _messageProducer = messageProducer;
            _logger = logger;
        }

        public async Task PublishReceiptGenerationAsync(int invoiceId, int contractId, int renterId)
        {
            var receiptEvent = new ReceiptGenerationEvent
            {
                InvoiceId = invoiceId,
                ContractId = contractId,
                RenterId = renterId 
            };

            await _messageProducer.PublishMessageAsync(receiptEvent, _queueName);
        }
    }
}
