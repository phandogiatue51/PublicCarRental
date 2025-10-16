using PublicCarRental.Application.DTOs.Message;

namespace PublicCarRental.Application.Service.PDF
{
    public interface IReceiptGenerationProducerService
    {
        Task PublishReceiptGenerationAsync(int invoiceId, int contractId, string renterEmail, string renterName);
    }

    public class ReceiptGenerationProducerService : IReceiptGenerationProducerService
    {
        private readonly BaseMessageProducer _messageProducer;
        private readonly ILogger<ReceiptGenerationProducerService> _logger;
        private readonly string _queueName = "receipt_generation_queue";

        public async Task PublishReceiptGenerationAsync(int invoiceId, int contractId, string renterEmail, string renterName)
        {
            var receiptEvent = new ReceiptGenerationEvent
            {
                InvoiceId = invoiceId,
                ContractId = contractId,
                RenterEmail = renterEmail,
                RenterName = renterName
            };

            await _messageProducer.PublishMessageAsync(receiptEvent, _queueName);
        }
    }
}
